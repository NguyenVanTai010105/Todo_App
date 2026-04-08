import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext.jsx";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { isAuthed, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthed) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login({ email, password });
      toast.success("Đăng nhập thành công");
      navigate("/", { replace: true });
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
              TodoX
            </h1>
            <p className="text-muted-foreground">Đăng nhập để tiếp tục</p>
          </div>

          <Card className="p-6 border-0 bg-gradient-card shadow-custom-lg">
            <form className="space-y-4" onSubmit={onSubmit}>
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
                <label className="text-sm font-medium">Mật khẩu</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
          </Card>

          <p className="text-sm text-center text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link className="text-primary hover:underline" to="/register">
              Đăng ký
            </Link>
          </p>

          <p className="text-sm text-center text-muted-foreground">
            Quên mật khẩu?{" "}
            <Link className="text-primary hover:underline" to="/forgot-password">
              Lấy lại mật khẩu
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

