import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext.jsx";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const { isAuthed } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("request"); // request | reset
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthed) return <Navigate to="/" replace />;

  const requestOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("Nếu email tồn tại, OTP đã được gửi");
      setStep("reset");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không kết nối được server (CORS/Network)",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { email, otp, newPassword });
      toast.success("Đổi mật khẩu thành công, hãy đăng nhập lại");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không kết nối được server (CORS/Network)",
      );
    } finally {
      setSubmitting(false);
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
      <div className="container relative z-10 pt-16 mx-auto">
        <div className="w-full max-w-md p-6 mx-auto space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold text-transparent bg-primary bg-clip-text">
              ToDoApp
            </h1>
            <p className="text-muted-foreground">Quên mật khẩu</p>
          </div>

          <Card className="p-6 border-0 bg-gradient-card shadow-custom-lg">
            {step === "request" ? (
              <form className="space-y-4" onSubmit={requestOtp}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  size="xl"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "Đang gửi..." : "Gửi OTP"}
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={resetPassword}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">OTP (6 chữ số)</label>
                  <Input
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Mật khẩu mới</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    minLength={6}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  size="xl"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "Đang đổi..." : "Đổi mật khẩu"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("request")}
                  disabled={submitting}
                >
                  Gửi lại OTP
                </Button>
              </form>
            )}
          </Card>

          <p className="text-sm text-center text-muted-foreground">
            Quay lại{" "}
            <Link className="text-primary hover:underline" to="/login">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

