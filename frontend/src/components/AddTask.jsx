import React, { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

const AddTask = ({ handleNewTaskAdded }) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const addTask = async () => {
    if (newTaskTitle.trim()) {
      try {
        await api.post("/tasks", {
          title: newTaskTitle,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          note,
          isImportant,
        });
        toast.success(`Nhiệm vụ ${newTaskTitle} đã được thêm vào.`);
        handleNewTaskAdded();
      } catch (error) {
        console.error("Lỗi xảy ra khi thêm task.", error);
        toast.error("Lỗi xảy ra khi thêm nhiệm vụ mới.");
      }

      setNewTaskTitle("");
      setDueAt("");
      setNote("");
      setIsImportant(false);
    } else {
      toast.error("Bạn cần nhập nội dung của nhiệm vụ.");
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      addTask();
    }
  };

  return (
    <Card className="p-6 border-0 bg-gradient-card shadow-custom-lg">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="text"
            placeholder="Cần phải làm gì?"
            className="h-11 text-base bg-slate-50 flex-1 border-border/50 focus:border-primary/50 focus:ring-primary/20"
            value={newTaskTitle}
            onChange={(even) => setNewTaskTitle(even.target.value)}
            onKeyPress={handleKeyPress}
          />

          <Input
            type="datetime-local"
            className="h-11 text-base bg-slate-50 border-border/50 focus:border-primary/50 focus:ring-primary/20 sm:w-60"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />

          <Button
            variant="gradient"
            size="xl"
            className="h-11 px-6 sm:shrink-0"
            onClick={addTask}
            disabled={!newTaskTitle.trim()}
          >
            <Plus className="size-5" />
            Thêm
          </Button>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={isImportant}
            onChange={(e) => setIsImportant(e.target.checked)}
            className="size-4 accent-primary"
          />
          Quan trọng (ưu tiên lên đầu)
        </label>

        <Textarea
          placeholder="Ghi chú (tuỳ chọn)..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="bg-slate-50 border-border/50 focus-visible:border-primary/50 focus-visible:ring-primary/20"
        />
      </div>
    </Card>
  );
};

export default AddTask;
