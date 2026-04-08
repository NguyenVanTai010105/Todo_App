import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import PasswordResetOtp from "../models/PasswordResetOtp.js";
import { sendPasswordResetOtpEmail } from "../utils/mailer.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Thiếu thông tin đăng ký" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash,
    });

    const token = signToken(user._id);
    return res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Lỗi register:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu email/mật khẩu" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).select(
      "_id name email passwordHash",
    );
    if (!user) {
      return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
    }

    const token = signToken(user._id);
    return res.status(200).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Lỗi login:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const me = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

function generateOtp6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Thiếu email" });
    }

    // Don't leak whether user exists
    const user = await User.findOne({ email: normalizedEmail }).select("_id email");
    if (!user) {
      return res.status(200).json({ message: "Nếu email tồn tại, OTP đã được gửi" });
    }

    // Invalidate previous unused OTPs for this email
    await PasswordResetOtp.updateMany(
      { email: normalizedEmail, usedAt: null },
      { $set: { usedAt: new Date() } },
    );

    const otp = generateOtp6();
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PasswordResetOtp.create({
      email: normalizedEmail,
      codeHash,
      expiresAt,
    });

    await sendPasswordResetOtpEmail({ toEmail: normalizedEmail, otp });

    return res.status(200).json({ message: "Nếu email tồn tại, OTP đã được gửi" });
  } catch (error) {
    console.error("Lỗi forgotPassword:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body || {};
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const otpStr = String(otp || "").trim();
    const pw = String(newPassword || "");

    if (!normalizedEmail || !otpStr || !pw) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }
    if (otpStr.length !== 6) {
      return res.status(400).json({ message: "OTP phải gồm 6 chữ số" });
    }
    if (pw.length < 6) {
      return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("_id");
    if (!user) {
      return res.status(400).json({ message: "OTP không đúng hoặc đã hết hạn" });
    }

    const record = await PasswordResetOtp.findOne({
      email: normalizedEmail,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .select("+codeHash email expiresAt usedAt");

    if (!record) {
      return res.status(400).json({ message: "OTP không đúng hoặc đã hết hạn" });
    }

    const ok = await bcrypt.compare(otpStr, record.codeHash);
    if (!ok) {
      return res.status(400).json({ message: "OTP không đúng hoặc đã hết hạn" });
    }

    const passwordHash = await bcrypt.hash(pw, 10);
    await User.updateOne({ _id: user._id }, { $set: { passwordHash } });
    record.usedAt = new Date();
    await record.save();

    return res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi resetPassword:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

