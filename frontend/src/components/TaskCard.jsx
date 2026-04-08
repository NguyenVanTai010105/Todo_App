import React, { useState } from "react";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Calendar,
  CheckCircle2,
  Circle,
  SquarePen,
  Star,
  Trash2,
} from "lucide-react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import api from "@/lib/axios";
import { toast } from "sonner";

const TaskCard = ({ task, index, handleTaskChanged }) => {
  const [isEditting, setIsEditting] = useState(false);
  const [updateTaskTitle, setUpdateTaskTitle] = useState(task.title || "");
  const [updateDueAt, setUpdateDueAt] = useState(
    task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : "",
  );
  const [updateNote, setUpdateNote] = useState(task.note || "");
  const [updateImportant, setUpdateImportant] = useState(Boolean(task.isImportant));

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success("Nhiệm vụ đã xoá.");
      handleTaskChanged();
    } catch (error) {
      console.error("Lỗi xảy ra khi xoá task.", error);
      toast.error("Lỗi xảy ra khi xoá nhiệm vụ mới.");
    }
  };

  const updateTask = async () => {
    try {
      setIsEditting(false);
      await api.put(`/tasks/${task._id}`, {
        title: updateTaskTitle,
        dueAt: updateDueAt ? new Date(updateDueAt).toISOString() : null,
        note: updateNote,
        isImportant: updateImportant,
      });
      toast.success(`Nhiệm vụ đã đổi thành ${updateTaskTitle}`);
      handleTaskChanged();
    } catch (error) {
      console.error("Lỗi xảy ra khi update task.", error);
      toast.error("Lỗi xảy ra khi cập nhập nhiệm vụ.");
    }
  };

  const toggleTaskCompleteButton = async () => {
    try {
      if (task.status === "active") {
        await api.put(`/tasks/${task._id}`, {
          status: "complete",
          completedAt: new Date().toISOString(),
        });

        toast.success(`${task.title} đã hoàn thành.`);
      } else {
        await api.put(`/tasks/${task._id}`, {
          status: "active",
          completedAt: null,
        });
        toast.success(`${task.title} đã đổi sang chưa hoàn thành.`);
      }

      handleTaskChanged();
    } catch (error) {
      console.error("Lỗi xảy ra khi update task.", error);
      toast.error("Lỗi xảy ra khi cập nhập nhiệm vụ.");
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      updateTask();
    }
  };

  const handleEditBlur = () => {
    setIsEditting(false);
    setUpdateTaskTitle(task.title || "");
    setUpdateDueAt(task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : "");
    setUpdateNote(task.note || "");
    setUpdateImportant(Boolean(task.isImportant));
  };

  const toggleImportant = async () => {
    try {
      await api.put(`/tasks/${task._id}`, {
        isImportant: !task.isImportant,
      });
      handleTaskChanged();
    } catch (error) {
      console.error("Lỗi xảy ra khi update task.", error);
      toast.error("Lỗi xảy ra khi cập nhập nhiệm vụ.");
    }
  };

  return (
    <Card
      className={cn(
        "p-4 bg-gradient-card border-0 shadow-custom-md hover:shadow-custom-lg transition-all duration-200 animate-fade-in group",
        task.status === "complete" && "opacity-75",
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-4">
        {/* nút tròn */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0 size-8 rounded-full transition-all duration-200",
            task.status === "complete"
              ? "text-success hover:text-success/80"
              : "text-muted-foreground hover:text-primary",
          )}
          onClick={toggleTaskCompleteButton}
        >
          {task.status === "complete" ? (
            <CheckCircle2 className="size-5" />
          ) : (
            <Circle className="size-5" />
          )}
        </Button>

        {/* hiển thị hoặc chỉnh sửa tiêu đề */}
        <div className="flex-1 min-w-0">
          {isEditting ? (
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Cần phải làm gì?"
                className="flex-1 h-12 text-base border-border/50 focus:border-primary/50 focus:ring-primary/20"
                type="text"
                value={updateTaskTitle}
                onChange={(e) => setUpdateTaskTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                onBlur={handleEditBlur}
              />
              <Input
                type="datetime-local"
                className="h-10 text-sm border-border/50 focus:border-primary/50 focus:ring-primary/20"
                value={updateDueAt}
                onChange={(e) => setUpdateDueAt(e.target.value)}
                onBlur={handleEditBlur}
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
                <input
                  type="checkbox"
                  checked={updateImportant}
                  onChange={(e) => setUpdateImportant(e.target.checked)}
                  className="size-4 accent-primary"
                />
                Quan trọng
              </label>
              <Textarea
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                placeholder="Ghi chú (tuỳ chọn)..."
                className="text-sm"
                onBlur={handleEditBlur}
              />
              <div className="text-xs text-muted-foreground">
                Tip: bấm Enter để lưu.
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <p
                className={cn(
                  "text-base transition-all duration-200",
                  task.status === "complete"
                    ? "line-through text-muted-foreground"
                    : "text-foreground",
                )}
              >
                {task.title}
              </p>
              {task.isImportant ? (
                <Star className="mt-0.5 size-4 text-amber-500 fill-amber-500" />
              ) : null}
            </div>
          )}

          {Boolean(task.note) && !isEditting ? (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {task.note}
            </p>
          ) : null}

          {/* ngày tạo & ngày hoàn thành */}
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {new Date(task.createdAt).toLocaleString()}
            </span>
            {task.dueAt && (
              <>
                <span className="text-xs text-muted-foreground"> • </span>
                <span className="text-xs text-muted-foreground">
                  Lịch: {new Date(task.dueAt).toLocaleString()}
                </span>
              </>
            )}
            {task.completedAt && (
              <>
                <span className="text-xs text-muted-foreground"> - </span>
                <Calendar className="size-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {new Date(task.completedAt).toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* nút chỉnh và xoá */}
        <div className="hidden gap-2 group-hover:inline-flex animate-slide-up">
          {/* nút important */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "shrink-0 transition-colors size-8",
              task.isImportant
                ? "text-amber-500 hover:text-amber-600"
                : "text-muted-foreground hover:text-amber-500",
            )}
            onClick={toggleImportant}
            title="Đánh dấu quan trọng"
          >
            <Star className={cn("size-4", task.isImportant && "fill-amber-500")} />
          </Button>
          {/* nút edit */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 transition-colors size-8 text-muted-foreground hover:text-info"
            onClick={() => {
              setIsEditting(true);
              setUpdateTaskTitle(task.title || "");
              setUpdateDueAt(
                task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : "",
              );
              setUpdateNote(task.note || "");
              setUpdateImportant(Boolean(task.isImportant));
            }}
          >
            <SquarePen className="size-4" />
          </Button>

          {/* nút xoá */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 transition-colors size-8 text-muted-foreground hover:text-destructive"
            onClick={() => deleteTask(task._id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;
