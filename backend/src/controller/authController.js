import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import PasswordResetOtp from "../models/PasswordResetOtp.js";
import { sendPasswordResetOtpEmail } from "../utils/mailer.js";

function publicUser(doc) {
  return {
    _id: doc._id,
    name: doc.name,
    email: doc.email,
    chatPaid: Boolean(doc.chatPaid),
  };
}

function normalizeDisplayName(name) {
  let n = String(name || "").trim();
  if (n.length < 2) n = "Người dùng";
  if (n.length > 50) n = n.slice(0, 50);
  return n;
}

async function upsertSocialUser({ email, name, googleSub }) {
  const normalizedEmail = String(email).toLowerCase().trim();
  const displayName = normalizeDisplayName(name);

  if (googleSub) {
    const byGoogle = await User.findOne({ googleSub });
    if (byGoogle) {
      if (byGoogle.name !== displayName || byGoogle.email !== normalizedEmail) {
        byGoogle.name = displayName;
        byGoogle.email = normalizedEmail;
        await byGoogle.save();
      }
      return byGoogle;
    }
  }

  const byEmail = await User.findOne({ email: normalizedEmail });
  if (byEmail) {
    let changed = false;
    if (googleSub && !byEmail.googleSub) {
      byEmail.googleSub = googleSub;
      changed = true;
    }
    if (byEmail.name !== displayName) {
      byEmail.name = displayName;
      changed = true;
    }
    if (changed) await byEmail.save();
    return byEmail;
  }

  return User.create({
    name: displayName,
    email: normalizedEmail,
    ...(googleSub ? { googleSub } : {}),
  });
}

async function verifyGoogleIdToken(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const err = new Error("GOOGLE_CLIENT_ID chưa cấu hình");
    err.status = 503;
    throw err;
  }
  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken: String(idToken),
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    const err = new Error("Token Google không hợp lệ");
    err.status = 401;
    throw err;
  }
  if (payload.email_verified === false) {
    const err = new Error("Email Google chưa được xác minh");
    err.status = 401;
    throw err;
  }
  return {
    sub: payload.sub,
    email: String(payload.email).toLowerCase(),
    name: payload.name || payload.email?.split("@")[0] || "Người dùng",
  };
}

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
      user: publicUser(user),
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
      "_id name email passwordHash chatPaid",
    );
    if (!user) {
      return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        message: "Tài khoản này đăng nhập bằng Google",
      });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
    }

    const token = signToken(user._id);
    return res.status(200).json({
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Lỗi login:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const me = async (req, res) => {
  return res.status(200).json({ user: publicUser(req.user) });
};

export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) {
      return res.status(400).json({ message: "Thiếu idToken" });
    }
    const profile = await verifyGoogleIdToken(idToken);
    const user = await upsertSocialUser({
      email: profile.email,
      name: profile.name,
      googleSub: profile.sub,
    });
    const token = signToken(user._id);
    return res.status(200).json({
      token,
      user: publicUser(user),
    });
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) console.error("Lỗi googleAuth:", error);
    return res.status(status).json({
      message: error.message || "Lỗi đăng nhập Google",
    });
  }
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

