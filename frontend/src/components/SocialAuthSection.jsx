import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext.jsx";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function SocialAuthSection({ disabled = false, onSuccess }) {
  const { loginWithGoogle } = useAuth();

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      toast.error("Đăng nhập Google thất bại");
      return;
    }
    try {
      await loginWithGoogle(idToken);
      onSuccess?.();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Đăng nhập Google thất bại",
      );
    }
  };

  if (!googleClientId) {
    if (import.meta.env.DEV) {
      return (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Để hiện nút Google: tạo file{" "}
          <span className="font-mono text-foreground/80">frontend/.env</span> với{" "}
          <span className="font-mono text-foreground/80">VITE_GOOGLE_CLIENT_ID</span> (cùng giá trị{" "}
          <span className="font-mono text-foreground/80">GOOGLE_CLIENT_ID</span> ở backend), sau đó
          chạy lại <span className="font-mono text-foreground/80">npm run dev</span>.
        </p>
      );
    }
    return null;
  }

  return (
    <div className={`mt-6 space-y-3 ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      <div className="relative flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs shrink-0 text-muted-foreground">hoặc tiếp tục với</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-center overflow-hidden rounded-md">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Đăng nhập Google thất bại")}
            useOneTap={false}
            theme="outline"
            size="large"
            width={320}
            text="continue_with"
            shape="rectangular"
          />
        </div>
      </div>
    </div>
  );
}
