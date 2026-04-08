import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import { chat } from "../controller/chatController.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", chat);

export default router;

