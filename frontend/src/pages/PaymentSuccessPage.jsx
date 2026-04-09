import React, { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext.jsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  const { isAuthed, refreshUser } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("working");

  const sessionId = params.get("session_id");

  useEffect(() => {
    if (!isAuthed || !sessionId) return;

    let cancelled = false;

    async function run() {
      try {
        await api.post("/billing/sync-session", { sessionId });
        await refreshUser();
        if (!cancelled) {
          setStatus("ok");
          toast.success("Thanh toán thành công! Bạn có thể dùng chat AI.");
          navigate("/", { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("err");
          toast.error(
            err?.response?.data?.message ||
              err?.message ||
              "Không xác nhận được thanh toán",
          );
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [isAuthed, sessionId, navigate, refreshUser]);

  if (!isAuthed) return <Navigate to="/login" replace />;

  if (!sessionId) {
    return (
      <div className="container mx-auto max-w-md p-8">
        <Card className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">Thiếu mã phiên thanh toán.</p>
          <Button asChild variant="outline">
            <Link to="/">Về trang chủ</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fefcff] p-6">
      <Card className="w-full max-w-sm space-y-3 p-8 text-center">
        <p className="font-medium">
          {status === "working" ? "Đang xác nhận thanh toán..." : null}
          {status === "err" ? "Có lỗi khi xác nhận." : null}
        </p>
        {status === "err" ? (
          <Button asChild variant="gradient" className="w-full">
            <Link to="/">Về trang chủ</Link>
          </Button>
        ) : null}
      </Card>
    </div>
  );
}
