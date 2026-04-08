import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import { deleteActivity, getActivities } from "../controller/activitiesController.js";

const router = express.Router();

router.use(requireAuth);
router.get("/", getActivities);
router.delete("/:id", deleteActivity);

export default router;

