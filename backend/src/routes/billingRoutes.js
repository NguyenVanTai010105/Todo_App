import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  billingInfo,
  createCheckoutSession,
  syncCheckoutSession,
} from "../controller/billingController.js";

const router = express.Router();

router.get("/info", billingInfo);
router.use(requireAuth);
router.post("/create-checkout-session", createCheckoutSession);
router.post("/sync-session", syncCheckoutSession);

export default router;
