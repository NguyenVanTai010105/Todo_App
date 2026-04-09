import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";

function formatVnd(n) {
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

export default function ChatPaywall({ compact = false }) {
  const [info, setInfo] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/billing/info")
      .then((r) => {
        if (!cancelled) setInfo(r.data);
      })
      .catch(() => {
        if (!cancelled) setInfo(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startCheckout = async () => {
    setPaying(true);
    try {
      const res = await api.post("/billing/create-checkout-session");
      const url = res.data?.url;
      if (!url) {
        toast.error("Không nhận được link thanh toán");
        return;
      }
      window.location.href = url;
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không tạo được phiên thanh toán",
      );
    } finally {
      setPaying(false);
    }
  };

  const price = info?.priceVnd ?? 49000;
  const name = info?.productName ?? "Mở khóa Chat AI — TodoX";
  const noStripe = info && !info.stripeConfigured && !info.paywallDisabled;

  return (
    <div
      className={
        compact
          ? "space-y-3 py-2 text-center"
          : "mx-auto max-w-md space-y-4 rounded-2xl border border-border/60 bg-white/70 p-6 text-center shadow-sm"
      }
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Chat AI — cần thanh toán</p>
        <p className="text-xs text-muted-foreground">
          {name}. Thanh toán một lần qua Stripe để mở khóa chat trên toàn bộ ứng dụng.
        </p>
      </div>
      <p className="text-lg font-bold text-primary">{formatVnd(price)}</p>
      {noStripe ? (
        <p className="text-xs text-amber-700">
          Server chưa cấu hình STRIPE_SECRET_KEY. Thêm khóa Stripe (test/live) vào backend{" "}
          <span className="font-mono">.env</span> hoặc bật{" "}
          <span className="font-mono">DISABLE_CHAT_PAYWALL=true</span> khi dev.
        </p>
      ) : null}
      <Button
        type="button"
        variant="gradient"
        className="w-full"
        disabled={paying || noStripe}
        onClick={startCheckout}
      >
        {paying ? "Đang chuyển..." : "Thanh toán với Stripe"}
      </Button>
    </div>
  );
}
