import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Minus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import ChatPaywall from "@/components/ChatPaywall.jsx";

export default function ChatWidget() {
  const { user } = useAuth();
  const [billing, setBilling] = useState(null);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Chào bạn! Bạn muốn mình giúp gì trong ToDoApp?",
    },
  ]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/billing/info")
      .then((r) => {
        if (!cancelled) setBilling(r.data);
      })
      .catch(() => {
        if (!cancelled) setBilling(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canUseChat = Boolean(billing?.paywallDisabled || user?.chatPaid);

  useEffect(() => {
    if (!open || minimized) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open, minimized]);

  const history = useMemo(() => {
    return messages.slice(-10).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      text: m.text,
    }));
  }, [messages]);

  const send = async (e) => {
    e?.preventDefault?.();
    if (!canUseChat) return;
    const msg = text.trim();
    if (!msg || sending) return;

    setText("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    try {
      const res = await api.post("/chat", { message: msg, history });
      const reply = res.data.reply || "Mình chưa có câu trả lời.";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === "CHAT_PAYMENT_REQUIRED" || err?.response?.status === 402) {
        toast.error("Cần thanh toán để dùng chat.");
        setMessages((prev) => prev.slice(0, -1));
        setText(msg);
      } else {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Không kết nối được server (CORS/Network)",
        );
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Có lỗi khi gửi tin nhắn. Thử lại giúp mình nhé.",
          },
        ]);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <Card
          className="w-85 border-0 bg-gradient-card shadow-custom-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-custom-xl"
          style={{ maxWidth: "calc(100vw - 2rem)" }}
        >
          <div className="flex items-center justify-between gap-2 px-4 pt-4">
            <div className="font-medium">Chat</div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setMinimized((v) => !v)}
                title={minimized ? "Mở rộng" : "Thu nhỏ"}
              >
                <Minus className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => {
                  setOpen(false);
                  setMinimized(false);
                }}
                title="Đóng"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {!minimized ? (
            <>
              <div className="px-4 pt-3 h-80 overflow-auto space-y-3">
                {canUseChat ? (
                  <>
                    {messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={
                            m.role === "user"
                              ? "max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-primary text-primary-foreground shadow"
                              : "max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-white/60 text-foreground shadow"
                          }
                        >
                          {m.text}
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </>
                ) : (
                  <ChatPaywall compact />
                )}
              </div>

              {canUseChat ? (
                <div className="mt-3 border-t bg-muted/30 p-3">
                  <form onSubmit={send} className="flex gap-2">
                    <Input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      className="bg-slate-50"
                    />
                    <Button
                      type="submit"
                      variant="gradient"
                      disabled={sending || !text.trim()}
                      className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                    >
                      {sending ? "..." : "Gửi"}
                    </Button>
                  </form>
                </div>
              ) : null}
            </>
          ) : (
            <div className="px-4 pb-4 pt-2 text-xs text-muted-foreground">
              Đang thu nhỏ. Bấm “—” để mở lại.
            </div>
          )}
        </Card>
      ) : null}

      {!open ? (
        <Button
          variant="gradient"
          size="icon"
          className="size-12 rounded-full shadow-custom-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          onClick={() => setOpen(true)}
          title="Mở chat"
        >
          <MessageCircle className="size-5" />
        </Button>
      ) : null}
    </div>
  );
}
