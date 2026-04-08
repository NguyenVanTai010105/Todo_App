import Activity from "../models/Activity.js";

export const getActivities = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limitRaw = Number(req.query.limit || 20);
    const limit = Math.min(100, Math.max(1, limitRaw));
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    const [items, total] = await Promise.all([
      Activity.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Activity.countDocuments(query),
    ]);

    return res.status(200).json({
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Lỗi getActivities:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const deleteActivity = async (req, res) => {
  try {
    const deleted = await Activity.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Bản ghi không tồn tại" });
    }

    return res.status(200).json({ message: "Đã xoá vĩnh viễn", deletedId: deleted._id });
  } catch (error) {
    console.error("Lỗi deleteActivity:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

