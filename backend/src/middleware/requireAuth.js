import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Thiếu JWT_SECRET" });
    }

    const payload = jwt.verify(token, secret);
    const userId = payload?.sub;
    if (!userId) return res.status(401).json({ message: "Token không hợp lệ" });

    const user = await User.findById(userId).select("_id name email chatPaid");
    if (!user) return res.status(401).json({ message: "User không tồn tại" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
}

