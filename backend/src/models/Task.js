import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    dueAt: {
      type: Date,
      default: null,
      index: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    isImportant: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "complete"],
      default: "active",
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt và updatedAt tự động được tạo
  },
);
const Task = mongoose.model("Task", taskSchema);
export default Task;
