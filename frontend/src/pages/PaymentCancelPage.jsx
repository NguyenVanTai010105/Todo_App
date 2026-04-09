import React from "react";
import { Link } from "react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fefcff] p-6">
      <Card className="w-full max-w-md space-y-4 p-8 text-center">
        <h1 className="text-lg font-semibold">Đã hủy thanh toán</h1>
        <p className="text-sm text-muted-foreground">
          Bạn có thể thanh toán lại bất cứ lúc nào từ ô chat hoặc trang Chat.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="gradient">
            <Link to="/">Về trang chủ</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/chat">Đến trang Chat</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
