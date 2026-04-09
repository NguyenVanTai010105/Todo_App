import Stripe from "stripe";
import User from "../models/User.js";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function billingInfo(req, res) {
  return res.status(200).json({
    priceVnd: Number(process.env.CHAT_PRICE_VND || "49000"),
    productName: process.env.CHAT_PRODUCT_NAME || "Mở khóa Chat AI — TodoX",
    paywallDisabled: process.env.DISABLE_CHAT_PAYWALL === "true",
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
  });
}

export async function createCheckoutSession(req, res) {
  try {
    if (process.env.DISABLE_CHAT_PAYWALL === "true") {
      return res.status(400).json({ message: "Paywall đang tắt (DISABLE_CHAT_PAYWALL)" });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ message: "Chưa cấu hình thanh toán (STRIPE_SECRET_KEY)" });
    }

    if (req.user.chatPaid) {
      return res.status(400).json({ message: "Bạn đã có quyền dùng chat" });
    }

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const amount = Number(process.env.CHAT_PRICE_VND || "49000");
    const name = process.env.CHAT_PRODUCT_NAME || "Mở khóa Chat AI — TodoX";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: req.user.email,
      client_reference_id: String(req.user._id),
      metadata: { userId: String(req.user._id) },
      line_items: [
        {
          price_data: {
            currency: "vnd",
            product_data: { name },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/payment/thanh-cong?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment/huy`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("createCheckoutSession:", err);
    return res.status(500).json({ message: err.message || "Không tạo được phiên thanh toán" });
  }
}

export async function syncCheckoutSession(req, res) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ message: "Chưa cấu hình thanh toán (STRIPE_SECRET_KEY)" });
    }

    const sessionId = String(req.body?.sessionId || "").trim();
    if (!sessionId) {
      return res.status(400).json({ message: "Thiếu sessionId" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.userId !== String(req.user._id)) {
      return res.status(403).json({ message: "Phiên thanh toán không thuộc tài khoản này" });
    }

    if (session.payment_status === "paid") {
      await User.updateOne(
        { _id: req.user._id },
        { $set: { chatPaid: true, chatPaidAt: new Date() } },
      );
    }

    const user = await User.findById(req.user._id).select("_id name email chatPaid");
    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        chatPaid: Boolean(user.chatPaid),
      },
      chatPaid: Boolean(user.chatPaid),
    });
  } catch (err) {
    console.error("syncCheckoutSession:", err);
    return res.status(500).json({ message: err.message || "Không xác minh được phiên thanh toán" });
  }
}

export async function stripeWebhook(req, res) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return res.status(503).send("Webhook chưa cấu hình");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).send("Thiếu stripe-signature");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error("Webhook signature:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId && session.payment_status === "paid") {
        await User.updateOne(
          { _id: userId },
          { $set: { chatPaid: true, chatPaidAt: new Date() } },
        );
      }
    }
  } catch (err) {
    console.error("stripeWebhook handler:", err);
    return res.status(500).json({ received: false });
  }

  return res.status(200).json({ received: true });
}
