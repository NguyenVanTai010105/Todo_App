import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendPasswordResetOtpEmail({ toEmail, otp }) {
  const transport = getTransport();

  // Dev fallback: no SMTP configured
  if (!transport) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV OTP] ${toEmail}: ${otp}`);
      return;
    }
    throw new Error("SMTP is not configured");
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  try {
    const info = await transport.sendMail({
      from,
      to: toEmail,
      subject: "TodoX - Mã OTP đặt lại mật khẩu",
      text: `Mã OTP của bạn là: ${otp}\nMã sẽ hết hạn sau 10 phút.\nNếu bạn không yêu cầu, hãy bỏ qua email này.`,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[MAIL SENT] to=${toEmail} messageId=${info?.messageId} accepted=${(info?.accepted || []).join(",")}`,
      );
    }
  } catch (err) {
    console.error("[MAIL ERROR]", err);
    throw err;
  }
}

