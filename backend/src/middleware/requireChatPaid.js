import User from "../models/User.js";

export default async function requireChatPaid(req, res, next) {
  if (process.env.DISABLE_CHAT_PAYWALL === "true") {
    return next();
  }

  const row = await User.findById(req.user._id).select("chatPaid");
  if (!row?.chatPaid) {
    return res.status(402).json({
      code: "CHAT_PAYMENT_REQUIRED",
      message: "Vui lòng thanh toán để sử dụng chat AI",
    });
  }
  next();
}
