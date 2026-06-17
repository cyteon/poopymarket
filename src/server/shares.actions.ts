"use server";

import { getCookie } from "vinxi/http";
import { getUserFromToken } from "./auth";
import { db } from "./db";
import { positions } from "./db/schema";
import { and, eq } from "drizzle-orm";
import { buySharesForUser, sellSharesForUser } from "./shares.server";

export async function getUserShares(marketId: number) {
  const token = getCookie("token");

  if (!token) {
    return { yesShares: 0, noShares: 0 };
  }

  const user = await getUserFromToken(token);

  if (!user) {
    return { yesShares: 0, noShares: 0 };
  }

  const [position] = await db
    .select()
    .from(positions)
    .where(
      and(eq(positions.marketId, marketId), eq(positions.userId, user.id)),
    );

  return {
    yesShares: position?.yesShares || 0,
    noShares: position?.noShares || 0,
    yesSpent: position?.yesSpent || 0,
    noSpent: position?.noSpent || 0,
  };
}

export async function buyShares({
  marketId,
  outcome,
  spend,
  minShares,
}: {
  marketId: number;
  outcome: "YES" | "NO";
  spend: number;
  minShares: number;
}) {
  "use server";

  if (spend <= 0) {
    throw new Error("Spend must be greater than 0");
  }

  if (outcome !== "YES" && outcome !== "NO") {
    throw new Error("Invalid outcome");
  }

  if (minShares <= 0) {
    throw new Error("Minimum shares must be greater than 0");
  }

  const token = getCookie("token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = await getUserFromToken(token);

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.banned) {
    throw new Error("Your account has been banned");
  }

  await buySharesForUser({
    user,
    marketId,
    outcome,
    spend,
    minShares,
  });
}

export async function sellShares({
  marketId,
  outcome,
  minValue,
}: {
  marketId: number;
  outcome: "YES" | "NO";
  minValue: number;
}) {
  const token = getCookie("token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = await getUserFromToken(token);

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.banned) {
    throw new Error("Your account has been banned");
  }

  await sellSharesForUser({
    user,
    marketId,
    outcome,
    minValue,
  });
}
