import Task from "../models/Task.js";

const VN_TZ = "Asia/Ho_Chi_Minh";

function getVnYmdParts(date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA -> YYYY-MM-DD
  const [y, m, d] = fmt.format(date).split("-").map((x) => Number(x));
  return { y, m, d };
}

function vnStartOfDay(date) {
  const { y, m, d } = getVnYmdParts(date);
  // VN midnight == UTC-7h
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 7 * 60 * 60 * 1000);
}

function vnEndOfDay(date) {
  const start = vnStartOfDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

function vnYmd(date) {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: VN_TZ });
  return fmt.format(date);
}

export const getMonthStats = async (req, res) => {
  try {
    const now = new Date();
    const end = vnEndOfDay(now);
    const start = new Date(vnStartOfDay(now).getTime() - 29 * 24 * 60 * 60 * 1000);

    const userId = req.user._id;

    const [completedCount, activeCount, completedByDay, activeByDay, completedList, activeList] =
      await Promise.all([
        Task.countDocuments({
          user: userId,
          status: "complete",
          completedAt: { $gte: start, $lte: end },
        }),
        Task.countDocuments({
          user: userId,
          status: "active",
          createdAt: { $gte: start, $lte: end },
        }),
        Task.aggregate([
          {
            $match: {
              user: userId,
              status: "complete",
              completedAt: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: {
                day: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$completedAt",
                    timezone: VN_TZ,
                  },
                },
              },
              count: { $sum: 1 },
            },
          },
        ]),
        Task.aggregate([
          {
            $match: {
              user: userId,
              status: "active",
              createdAt: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: {
                day: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt",
                    timezone: VN_TZ,
                  },
                },
              },
              count: { $sum: 1 },
            },
          },
        ]),
        Task.find({
          user: userId,
          status: "complete",
          completedAt: { $gte: start, $lte: end },
        })
          .sort({ completedAt: -1 })
          .select("_id title completedAt createdAt dueAt isImportant")
          .lean(),
        Task.find({
          user: userId,
          status: "active",
          createdAt: { $gte: start, $lte: end },
        })
          .sort({ createdAt: -1 })
          .select("_id title createdAt dueAt isImportant")
          .lean(),
      ]);

    const totals = { active: activeCount, complete: completedCount };

    // Build daily series for the last 30 days
    const byDay = new Map(); // day -> { day, active, complete }
    for (const row of activeByDay) {
      const day = row._id.day;
      const existing = byDay.get(day) || { day, active: 0, complete: 0 };
      existing.active = row.count;
      byDay.set(day, existing);
    }
    for (const row of completedByDay) {
      const day = row._id.day;
      const existing = byDay.get(day) || { day, active: 0, complete: 0 };
      existing.complete = row.count;
      byDay.set(day, existing);
    }

    const days = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const key = vnYmd(d);
      days.push(byDay.get(key) || { day: key, active: 0, complete: 0 });
    }

    const total = totals.active + totals.complete;
    const completionRate = total > 0 ? Math.round((totals.complete / total) * 100) : 0;

    return res.status(200).json({
      range: { start, end, days: 30 },
      totals,
      completionRate,
      daily: days,
      completedTasks: completedList,
      activeTasks: activeList,
    });
  } catch (error) {
    console.error("Lỗi getMonthStats:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

