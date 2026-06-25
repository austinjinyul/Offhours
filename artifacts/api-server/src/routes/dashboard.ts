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

// Coordinates for each event's neighborhood
const VENUE_COORDS: Record<string, { lat: number; lng: number }> = {
  "evt-001": { lat: 37.8078, lng: -122.2143 }, // Grand Lake, Oakland
  "evt-002": { lat: 37.7766, lng: -122.4226 }, // Hayes Valley, SF
  "evt-003": { lat: 37.7956, lng: -122.3942 }, // Embarcadero, SF
  "evt-004": { lat: 37.7785, lng: -122.3991 }, // SOMA, SF
  "evt-005": { lat: 37.7598, lng: -122.4007 }, // Potrero Hill, SF
};

// Default work coords: Downtown SF Financial District
const DEFAULT_WORK = { lat: 37.7946, lng: -122.3999 };

// Max one-way travel time (minutes) before event is filtered out
const MAX_TRAVEL_MINUTES = 45;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateTravelMinutes(distanceMiles: number): number {
  // City driving: ~20 mph average + 3 min constant buffer (parking, etc.)
  return Math.round((distanceMiles / 20) * 60) + 3;
}

function travelLabel(minutes: number): string {
  if (minutes < 5) return "< 5 min walk";
  if (minutes <= 20) return `${minutes} min drive`;
  return `~${minutes} min drive`;
}

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

function enrichWithTravel(
  events: typeof DUMMY_EVENTS,
  workLat: number,
  workLng: number
) {
  return events.map((evt) => {
    const coords = VENUE_COORDS[evt.id];
    if (!coords) {
      return { ...evt, travelTimeMinutes: null, travelLabel: null, travelable: null };
    }
    const dist = haversineDistance(workLat, workLng, coords.lat, coords.lng);
    const minutes = estimateTravelMinutes(dist);
    return {
      ...evt,
      travelTimeMinutes: minutes,
      travelLabel: travelLabel(minutes),
      travelable: minutes <= MAX_TRAVEL_MINUTES,
    };
  });
}

router.get("/dashboard/sunday-reset", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const userRows = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.userId));
    const user = userRows[0];
    const interests = user?.interests ?? [];
    const workLat = user?.workLat ?? DEFAULT_WORK.lat;
    const workLng = user?.workLng ?? DEFAULT_WORK.lng;

    // Enrich with travel info
    const enriched = enrichWithTravel(DUMMY_EVENTS, workLat, workLng);

    // Filter out unreachable events
    const reachable = enriched.filter(evt => evt.travelable !== false);

    // Sort: interest-matched first
    const sorted = [...reachable].sort((a, b) => {
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

    const userRows = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.userId));
    const user = userRows[0];
    const workLat = user?.workLat ?? DEFAULT_WORK.lat;
    const workLng = user?.workLng ?? DEFAULT_WORK.lng;
    const reachable = enrichWithTravel(DUMMY_EVENTS, workLat, workLng).filter(e => e.travelable !== false);

    const totalFreeMinutes = gaps.reduce((sum, g) => sum + g.durationMinutes, 0);
    const totalFreeHours = Math.round((totalFreeMinutes / 60) * 10) / 10;

    const pad = (n: number) => n.toString().padStart(2, "0");
    const weekStartDate = `${weekStart.getFullYear()}-${pad(weekStart.getMonth() + 1)}-${pad(weekStart.getDate())}`;

    res.json(GetDashboardSummaryResponse.parse({
      gapsThisWeek: gaps.length,
      totalFreeHours,
      suggestedEventsCount: reachable.length,
      weekStartDate,
    }));
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
