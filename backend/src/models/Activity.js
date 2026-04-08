import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["task"],
      required: true,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    action: {
      type: String,
      enum: ["create", "update", "complete", "uncomplete", "delete"],
      required: true,
      index: true,
    },
    // snapshot after action (for delete this stores last known state)
    snapshot: {
      type: Object,
      default: null,
    },
    // minimal diff for updates
    changes: {
      type: Object,
      default: null,
    },
  },
  { timestamps: true },
);

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;

