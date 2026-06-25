import { Router, type IRouter } from "express";
import {
  GetCalendarGapsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { detectGaps, getDummyCalendarEvents, getCurrentWeekBounds } from "../lib/calendarGaps";

const router: IRouter = Router();

router.get("/calendar/gaps", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const { weekStart, weekEnd } = getCurrentWeekBounds();
    const events = getDummyCalendarEvents(weekStart);
    const gaps = detectGaps(events, weekStart, weekEnd);
    res.json(GetCalendarGapsResponse.parse(gaps));
  } catch (err) {
    req.log.error({ err }, "Failed to get calendar gaps");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
