import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

function formatAction(action) {
  switch (action) {
    case "create":
      return "Tạo";
    case "update":
      return "Cập nhật";
    case "complete":
      return "Hoàn thành";
    case "uncomplete":
      return "Bỏ hoàn thành";
    case "delete":
      return "Xoá";
    default:
      return action;
  }
}

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = async ({ pageParam = page } = {}) => {
    setLoading(true);
    try {
      const res = await api.get(`/activities?page=${pageParam}&limit=20`);
      setItems(res.data.items || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không kết nối được server (CORS/Network)",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    load().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [page]);

  const deleteForever = async (id) => {
    const ok = window.confirm("Xoá vĩnh viễn bản ghi này khỏi database?");
    if (!ok) return;
    try {
      await api.delete(`/activities/${id}`);
      toast.success("Đã xoá vĩnh viễn");
      await load({ pageParam: page });
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không kết nối được server (CORS/Network)",
      );
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link to="/">← Trang chủ</Link>
              </Button>
              <h2 className="text-xl font-semibold">Lịch sử hoạt động</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <span className="text-sm text-muted-foreground">
                {page}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {items.length === 0 ? (
              <Card className="p-6 border-0 bg-gradient-card shadow-custom-md">
                <div className="text-sm text-muted-foreground">
                  Chưa có hoạt động nào.
                </div>
              </Card>
            ) : (
              items.map((a) => {
                const title = a?.snapshot?.title || "(không có tiêu đề)";
                return (
                  <Card
                    key={a._id}
                    className="p-4 border-0 bg-gradient-card shadow-custom-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm text-muted-foreground">
                          {formatAction(a.action)} •{" "}
                          {new Date(a.createdAt).toLocaleString()}
                        </div>
                        <div className="font-medium truncate">{title}</div>
                        {a.action === "delete" ? (
                          <div className="text-xs text-muted-foreground mt-1">
                            (Đã xoá nhưng vẫn lưu trong lịch sử)
                          </div>
                        ) : null}
                      </div>
                      {a?.snapshot?.isImportant ? (
                        <span className="text-xs text-amber-600 font-medium">
                          Quan trọng
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteForever(a._id)}
                      >
                        <Trash2 className="size-4" />
                        Xoá vĩnh viễn
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

