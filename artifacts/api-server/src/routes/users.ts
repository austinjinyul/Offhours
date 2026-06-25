import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetMeResponse,
  UpdateInterestsBody,
  UpdateInterestsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

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

router.get("/users/me", requireAuth, async (req: any, res): Promise<void> => {
  try {
    const user = await getOrCreateUser(req.userId, req);
    res.json(GetMeResponse.parse({
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      interests: user.interests,
      onboardingComplete: user.onboardingComplete,
      createdAt: user.createdAt.toISOString(),
    }));
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

    res.json(UpdateInterestsResponse.parse({
      clerkId: updated.clerkId,
      email: updated.email,
      name: updated.name,
      avatarUrl: updated.avatarUrl,
      interests: updated.interests,
      onboardingComplete: updated.onboardingComplete,
      createdAt: updated.createdAt.toISOString(),
    }));
  } catch (err) {
    req.log.error({ err }, "Failed to update interests");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
