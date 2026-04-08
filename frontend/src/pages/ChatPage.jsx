import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Chào bạn! Bạn muốn mình giúp gì trong TodoX?" },
  ]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const history = useMemo(() => {
    // send last messages to backend
    return messages
      .slice(-10)
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", text: m.text }));
  }, [messages]);

  const send = async (e) => {
    e?.preventDefault?.();
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
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không kết nối được server (CORS/Network)",
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Có lỗi khi gửi tin nhắn. Thử lại giúp mình nhé." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fefcff] relative">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
        radial-gradient(circle at 30% 70%, rgba(173, 216, 230, 0.35), transparent 60%),
        radial-gradient(circle at 70% 30%, rgba(255, 182, 193, 0.4), transparent 60%)`,
        }}
      />

      <div className="container relative z-10 pt-8 mx-auto">
        <div className="w-full max-w-2xl p-6 mx-auto space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link to="/">← Trang chủ</Link>
              </Button>
              <h2 className="text-xl font-semibold">Chat</h2>
            </div>
          </div>

          <Card className="border-0 bg-gradient-card shadow-custom-md">
            <div className="p-4 h-[55vh] overflow-auto space-y-3">
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
            </div>

            <div className="border-t bg-muted/30 p-3">
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
                  className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {sending ? "Đang gửi..." : "Gửi"}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

