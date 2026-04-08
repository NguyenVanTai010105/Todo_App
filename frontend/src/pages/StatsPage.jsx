import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function StatsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/stats/month");
        if (cancelled) return;
        setData(res.data);
      } catch (err) {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Không kết nối được server (CORS/Network)",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const donut = useMemo(() => {
    const active = data?.totals?.active || 0;
    const complete = data?.totals?.complete || 0;
    return [
      { name: "Chưa hoàn thành", value: active },
      { name: "Đã hoàn thành", value: complete },
    ];
  }, [data]);

  const donutColors = ["#60a5fa", "#22c55e"];

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
        <div className="w-full max-w-3xl p-6 mx-auto space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link to="/">← Trang chủ</Link>
              </Button>
              <h2 className="text-xl font-semibold">Thống kê 30 ngày</h2>
            </div>

            <div className="text-sm text-muted-foreground">
              Hiệu suất:{" "}
              <span className="font-medium text-foreground">
                {data?.completionRate ?? 0}%
              </span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Card className="p-4 border-0 bg-gradient-card shadow-custom-md">
              <div className="text-sm text-muted-foreground">Đã hoàn thành</div>
              <div className="text-2xl font-semibold">
                {data?.totals?.complete ?? 0}
              </div>
            </Card>
            <Card className="p-4 border-0 bg-gradient-card shadow-custom-md">
              <div className="text-sm text-muted-foreground">Chưa hoàn thành</div>
              <div className="text-2xl font-semibold">
                {data?.totals?.active ?? 0}
              </div>
            </Card>
            <Card className="p-4 border-0 bg-gradient-card shadow-custom-md">
              <div className="text-sm text-muted-foreground">Tổng công việc</div>
              <div className="text-2xl font-semibold">
                {(data?.totals?.active ?? 0) + (data?.totals?.complete ?? 0)}
              </div>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <Card className="p-4 border-0 bg-gradient-card shadow-custom-md md:col-span-3">
              <div className="mb-3 font-medium">
                Xu hướng theo ngày (30 ngày gần nhất)
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.daily || []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis
                      dataKey="day"
                      tickFormatter={(v) => String(v).slice(5)}
                      minTickGap={12}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="complete"
                      name="Hoàn thành (theo ngày hoàn thành)"
                      fill="#22c55e"
                    />
                    <Bar
                      dataKey="active"
                      name="Chưa hoàn thành (tạo trong 30 ngày)"
                      fill="#60a5fa"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 border-0 bg-gradient-card shadow-custom-md md:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-medium">Tỷ lệ hoàn thành</div>
                <div className="text-sm text-muted-foreground">
                  {data?.completionRate ?? 0}%
                </div>
              </div>

              <div className="relative h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Pie
                      data={donut}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={2}
                      stroke="rgba(255,255,255,0.75)"
                      strokeWidth={2}
                    >
                      {donut.map((_, i) => (
                        <Cell key={i} fill={donutColors[i % donutColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-semibold text-foreground">
                      {data?.completionRate ?? 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Hoàn thành</div>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: donutColors[1] }}
                  />
                  <span>Đã hoàn thành</span>
                  <span className="font-medium text-foreground">
                    {data?.totals?.complete ?? 0}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: donutColors[0] }}
                  />
                  <span>Chưa hoàn thành</span>
                  <span className="font-medium text-foreground">
                    {data?.totals?.active ?? 0}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {loading
                  ? "Đang tải..."
                  : "Đã hoàn thành tính theo ngày bạn hoàn thành. Chưa hoàn thành tính theo ngày tạo (30 ngày gần nhất)."}
              </div>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Card className="p-4 border-0 bg-gradient-card shadow-custom-md">
              <div className="font-medium mb-2">Đã hoàn thành (trong 30 ngày)</div>
              <div className="space-y-1 text-sm">
                {(data?.completedTasks || []).slice(0, 8).map((t) => (
                  <div key={t._id} className="flex items-center justify-between gap-3">
                    <span className="truncate">{t.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {t.completedAt ? new Date(t.completedAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                ))}
                {(data?.completedTasks || []).length === 0 ? (
                  <div className="text-muted-foreground">Chưa có công việc hoàn thành.</div>
                ) : null}
              </div>
            </Card>

            <Card className="p-4 border-0 bg-gradient-card shadow-custom-md">
              <div className="font-medium mb-2">Chưa hoàn thành (tạo trong 30 ngày)</div>
              <div className="space-y-1 text-sm">
                {(data?.activeTasks || []).slice(0, 8).map((t) => (
                  <div key={t._id} className="flex items-center justify-between gap-3">
                    <span className="truncate">{t.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                ))}
                {(data?.activeTasks || []).length === 0 ? (
                  <div className="text-muted-foreground">Không có công việc đang làm.</div>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

