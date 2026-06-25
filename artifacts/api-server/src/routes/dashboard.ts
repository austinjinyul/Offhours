import { Router, type IRouter } from "express";
import {
  GetSundayResetResponse,
  GetDashboardSummaryResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { detectGaps, getDummyCalendarEvents, getCurrentWeekBounds } from "../lib/calendarGaps";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const DUMMY_EVENTS = [
  {
    id: "evt-001",
    title: "Natural Wine Tasting",
    category: "Food & Drink",
    dayOfWeek: "Tuesday",
    time: "Tuesday 7:00 PM",
    venue: "Ordinaire Wine Bar",
    neighborhood: "Grand Lake",
    description: "Explore low-intervention wines from small European producers. Guided flight of 6.",
    matchedInterest: "Natural wine",
  },
  {
    id: "evt-002",
    title: "Morning Pilates Flow",
    category: "Fitness",
    dayOfWeek: "Wednesday",
    time: "Wednesday 6:30 AM",
    venue: "The Pilates Studio",
    neighborhood: "Hayes Valley",
    description: "60-minute reformer class focused on core strength and spinal mobility.",
    matchedInterest: "Pilates",
  },
  {
    id: "evt-003",
    title: "Tech Founders Mixer",
    category: "Networking",
    dayOfWeek: "Thursday",
    time: "Thursday 6:30 PM",
    venue: "Atrium at Pier 17",
    neighborhood: "Embarcadero",
    description: "Curated gathering of Series A and B founders. Invitation-only, 80 attendees.",
    matchedInterest: "Tech mixers",
  },
  {
    id: "evt-004",
    title: "Cold Plunge + Sauna Session",
    category: "Wellness",
    dayOfWeek: "Friday",
    time: "Friday 5:30 PM",
    venue: "Bathhouse SF",
    neighborhood: "SOMA",
    description: "90-minute thermal circuit with guided breathwork intro. Walk-in friendly.",
    matchedInterest: null,
  },
  {
    id: "evt-005",
    title: "Bookclub: Fiction & Cognac",
    category: "Social",
    dayOfWeek: "Sunday",
    time: "Sunday 4:00 PM",
    venue: "Lost & Found",
    neighborhood: "Potrero Hill",
    description: "Monthly literary salon. This month: Kazuo Ishiguro's Klara and the Sun.",
    matchedInterest: null,
  },
];

router.get("/dashboard/sunday-reset", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const user = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.userId));
    const interests = user[0]?.interests ?? [];

    // Sort to put interest-matched events first
    const sorted = [...DUMMY_EVENTS].sort((a, b) => {
      const aMatches = a.matchedInterest && interests.some((i: string) =>
        i.toLowerCase().includes((a.matchedInterest ?? "").toLowerCase()) ||
        (a.matchedInterest ?? "").toLowerCase().includes(i.toLowerCase())
      );
      const bMatches = b.matchedInterest && interests.some((i: string) =>
        i.toLowerCase().includes((b.matchedInterest ?? "").toLowerCase()) ||
        (b.matchedInterest ?? "").toLowerCase().includes(i.toLowerCase())
      );
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });

    res.json(GetSundayResetResponse.parse(sorted));
  } catch (err) {
    req.log.error({ err }, "Failed to get sunday reset");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/summary", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const { weekStart, weekEnd } = getCurrentWeekBounds();
    const events = getDummyCalendarEvents(weekStart);
    const gaps = detectGaps(events, weekStart, weekEnd);

    const totalFreeMinutes = gaps.reduce((sum, g) => sum + g.durationMinutes, 0);
    const totalFreeHours = Math.round((totalFreeMinutes / 60) * 10) / 10;

    const pad = (n: number) => n.toString().padStart(2, "0");
    const weekStartDate = `${weekStart.getFullYear()}-${pad(weekStart.getMonth() + 1)}-${pad(weekStart.getDate())}`;

    res.json(GetDashboardSummaryResponse.parse({
      gapsThisWeek: gaps.length,
      totalFreeHours,
      suggestedEventsCount: DUMMY_EVENTS.length,
      weekStartDate,
    }));
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
