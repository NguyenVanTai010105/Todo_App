import express from "express";
import {
  forgotPassword,
  login,
  me,
  register,
  resetPassword,
} from "../controller/authController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", requireAuth, me);

export default router;

