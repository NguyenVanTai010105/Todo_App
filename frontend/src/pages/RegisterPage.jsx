import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext.jsx";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const { isAuthed, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthed) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register({ name, email, password });
      toast.success("Đăng ký thành công");
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
              ToDoApp
            </h1>
            <p className="text-muted-foreground">Tạo tài khoản mới</p>
          </div>

          <Card className="p-6 border-0 bg-gradient-card shadow-custom-lg">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên của bạn"
                  required
                />
              </div>

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
                {submitting ? "Đang tạo..." : "Đăng ký"}
              </Button>
            </form>
          </Card>

          <p className="text-sm text-center text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link className="text-primary hover:underline" to="/login">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

