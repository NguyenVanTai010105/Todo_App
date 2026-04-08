import React from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { useAuth } from "@/context/AuthContext.jsx";

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-left">
          <h1 className="text-4xl font-bold text-transparent bg-primary bg-clip-text">
            ToDoApp
          </h1>
          <p className="text-muted-foreground">
            Không có việc gì khó, chỉ sợ mình không làm 💪
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user?.name ? (
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Xin chào, <span className="font-medium text-foreground">{user.name}</span>
            </span>
          ) : null}
          <Button
            variant="outline"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Đăng xuất
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <Link className="hover:underline" to="/">
          Trang chủ
        </Link>
      </div>
    </div>
  );
};
