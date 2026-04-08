import Task from "../models/Task.js";
import Activity from "../models/Activity.js";

function toSnapshot(task) {
  if (!task) return null;
  const obj = typeof task.toObject === "function" ? task.toObject() : task;
  return {
    _id: obj._id,
    title: obj.title,
    note: obj.note,
    dueAt: obj.dueAt,
    status: obj.status,
    completedAt: obj.completedAt,
    isImportant: obj.isImportant,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

export const getAllTasks = async (req, res) => {
  const { filter = "today" } = req.query;
  const now = new Date();
  let startDate;
  let endDate;

  switch (filter) {
    case "today": {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 2025-08-24 00:00
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    }
    case "week": {
      const mondayDate =
        now.getDate() - (now.getDay() - 1) - (now.getDay() === 0 ? 7 : 0);
      startDate = new Date(now.getFullYear(), now.getMonth(), mondayDate);
      endDate = new Date(now.getFullYear(), now.getMonth(), mondayDate + 7);
      break;
    }
    case "month": {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    }
    case "all":
    default: {
      startDate = null;
      endDate = null;
    }
  }

  // Lọc theo lịch hẹn (dueAt). Nếu task chưa có dueAt thì fallback createdAt để không "biến mất" task cũ.
  const dateMatch =
    startDate && endDate
      ? {
          $or: [
            { dueAt: { $gte: startDate, $lt: endDate } },
            { dueAt: null, createdAt: { $gte: startDate, $lt: endDate } },
          ],
        }
      : {};

  const query = {
    user: req.user._id,
    ...dateMatch,
  };

  try {
    const result = await Task.aggregate([
      { $match: query },
      {
        $facet: {
          tasks: [{ $sort: { isImportant: -1, createdAt: -1 } }],
          activeCount: [{ $match: { status: "active" } }, { $count: "count" }],
          completeCount: [
            { $match: { status: "complete" } },
            { $count: "count" },
          ],
        },
      },
    ]);

    const tasks = result[0].tasks;
    const activeCount = result[0].activeCount[0]?.count || 0;
    const completeCount = result[0].completeCount[0]?.count || 0;

    res.status(200).json({ tasks, activeCount, completeCount });
  } catch (error) {
    console.error("Lỗi khi gọi getAllTasks", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, dueAt, note, isImportant } = req.body;
    const task = new Task({
      title,
      user: req.user._id,
      dueAt: dueAt ? new Date(dueAt) : null,
      note: typeof note === "string" ? note : "",
      isImportant: Boolean(isImportant),
    });

    const newTask = await task.save();
    await Activity.create({
      user: req.user._id,
      entityType: "task",
      entityId: newTask._id,
      action: "create",
      snapshot: toSnapshot(newTask),
    });
    res.status(201).json(newTask);
  } catch (error) {
    console.error("Lỗi khi gọi createTask", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, status, completedAt, dueAt, note, isImportant } = req.body;

    const before = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!before) {
      return res.status(404).json({ message: "Nhiệm vụ không tồn tại" });
    }

    const updateDoc = {
      ...(title !== undefined ? { title } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(completedAt !== undefined ? { completedAt } : {}),
      ...(dueAt !== undefined ? { dueAt: dueAt ? new Date(dueAt) : null } : {}),
      ...(note !== undefined ? { note: typeof note === "string" ? note : "" } : {}),
      ...(isImportant !== undefined ? { isImportant: Boolean(isImportant) } : {}),
    };

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateDoc,
      { new: true },
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Nhiệm vụ không tồn tại" });
    }

    let action = "update";
    if (before.status !== updatedTask.status) {
      if (updatedTask.status === "complete") action = "complete";
      if (updatedTask.status === "active") action = "uncomplete";
    }

    const changes = {};
    for (const k of Object.keys(updateDoc)) {
      changes[k] = { from: before[k], to: updatedTask[k] };
    }

    await Activity.create({
      user: req.user._id,
      entityType: "task",
      entityId: updatedTask._id,
      action,
      snapshot: toSnapshot(updatedTask),
      changes,
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Lỗi khi gọi updateTask", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: "Nhiệm vụ không tồn tại" });
    }

    await Task.deleteOne({ _id: task._id, user: req.user._id });

    await Activity.create({
      user: req.user._id,
      entityType: "task",
      entityId: task._id,
      action: "delete",
      snapshot: toSnapshot(task),
    });

    res.status(200).json(task);
  } catch (error) {
    console.error("Lỗi khi gọi deleteTask", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
