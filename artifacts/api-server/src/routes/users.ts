import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetMeResponse,
  UpdateInterestsBody,
  UpdateInterestsResponse,
  UpdateLocationBody,
  UpdateLocationResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

async function getOrCreateUser(clerkId: string, req: any): Promise<typeof usersTable.$inferSelect> {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (existing[0]) return existing[0];

  const auth = getAuth(req);
  const sessionClaims = auth?.sessionClaims as any;
  const email = sessionClaims?.email ?? `${clerkId}@unknown.com`;
  const name = sessionClaims?.name ?? null;
  const avatarUrl = sessionClaims?.image_url ?? null;

  const [newUser] = await db.insert(usersTable).values({
    clerkId,
    email,
    name,
    avatarUrl,
    interests: [],
    onboardingComplete: false,
  }).returning();
  return newUser;
}

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    interests: user.interests,
    onboardingComplete: user.onboardingComplete,
    workAddress: user.workAddress ?? null,
    workLat: user.workLat ?? null,
    workLng: user.workLng ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/users/me", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const user = await getOrCreateUser(req.userId, req);
    res.json(GetMeResponse.parse(serializeUser(user)));
  } catch (err) {
    req.log.error({ err }, "Failed to get user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/users/me/interests", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = UpdateInterestsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { interests } = parsed.data;

  try {
    await getOrCreateUser(req.userId, req);
    const [updated] = await db
      .update(usersTable)
      .set({ interests, onboardingComplete: true })
      .where(eq(usersTable.clerkId, req.userId))
      .returning();

    res.json(UpdateInterestsResponse.parse(serializeUser(updated)));
  } catch (err) {
    req.log.error({ err }, "Failed to update interests");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/users/me/location", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = UpdateLocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { workAddress } = parsed.data;
  let workLat: number | null = null;
  let workLng: number | null = null;
  let geocoded = false;

  try {
    const geocodeRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(workAddress)}&format=json&limit=1`,
      {
        headers: { "User-Agent": "Offhours.ai/1.0 contact@offhours.ai" },
      }
    );
    const data = await geocodeRes.json() as Array<{ lat: string; lon: string }>;
    if (data[0]) {
      workLat = parseFloat(data[0].lat);
      workLng = parseFloat(data[0].lon);
      geocoded = true;
    }
  } catch (err) {
    req.log.warn({ err }, "Nominatim geocoding failed, storing address without coordinates");
  }

  try {
    await getOrCreateUser(req.userId, req);
    const [updated] = await db
      .update(usersTable)
      .set({ workAddress, workLat, workLng })
      .where(eq(usersTable.clerkId, req.userId))
      .returning();

    res.json(UpdateLocationResponse.parse({
      workAddress: updated.workAddress ?? null,
      workLat: updated.workLat ?? null,
      workLng: updated.workLng ?? null,
      geocoded,
    }));
  } catch (err) {
    req.log.error({ err }, "Failed to update location");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
