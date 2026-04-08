import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import { getMonthStats } from "../controller/statsController.js";

const router = express.Router();
router.use(requireAuth);

router.get("/month", getMonthStats);

export default router;

