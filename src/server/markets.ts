"use server";

import { getCookie } from "vinxi/http";
import { getUserFromToken } from "./auth";
import { ledger, markets, positions, trades, users } from "./db/schema";
import { db } from "./db";
import { and, asc, desc, eq, sql } from "drizzle-orm";

export async function createMarket(
  question: string,
  rules: string,
  category: string,
) {
  if (!question.trim() || !rules.trim()) {
    throw new Error("Question and rules cannot be empty");
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

  if (user.balance < 500) {
    throw new Error("Insufficient balance");
  }

  const [market] = await db
    .insert(markets)
    .values({
      question,
      rules,
      creatorId: user.id,
      b: 1000,
      category: category as any,
    })
    .returning();

  await db
    .update(users)
    .set({ balance: sql`${users.balance} - 500` })
    .where(eq(users.id, user.id));

  return { id: market.id };
}

export async function getMarket(id: number) {
  const [market] = await db.select().from(markets).where(eq(markets.id, id));

  const chanceData = await db
    .select({ probAfter: trades.probAfter, createdAt: trades.createdAt })
    .from(trades)
    .where(eq(trades.marketId, id))
    .orderBy(asc(trades.createdAt));

  const byTime = new Map<number, number>();

  for (const c of chanceData) {
    byTime.set(Math.floor(c.createdAt.getTime() / 1000), c.probAfter);
  }

  const points = [...byTime.entries()].map(([time, value]) => ({
    time,
    value,
  }));

  const topPositions = await db
    .select({
      username: users.username,
      yesShares: positions.yesShares,
      noShares: positions.noShares,
      spent: sql`${positions.yesSpent} + ${positions.noSpent}`,
    })
    .from(positions)
    .innerJoin(users, eq(positions.userId, users.id))
    .where(and(eq(positions.marketId, id), eq(users.banned, false)))
    .orderBy(desc(sql`(${positions.yesShares} + ${positions.noShares})`))
    .limit(5);

  return { ...market, points, topPositions };
}

export async function getMarkets() {
  return await db
    .select()
    .from(markets)
    .where(eq(markets.resolved, false))
    .orderBy(desc(markets.volume));
}

export async function resolveMarket(id: number, resolution: "YES" | "NO") {
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

  await db.transaction(async (tx) => {
    const [market] = await tx
      .select()
      .from(markets)
      .where(eq(markets.id, id))
      .for("update");

    if (!market) {
      throw new Error("Market not found");
    }

    if (market.creatorId !== user.id && !user.admin) {
      throw new Error("Only the creator can resolve the market");
    }

    if (!user.admin && market.preventCreatorResolution) {
      throw new Error("Market resolution has been locked to admins only");
    }

    if (market.resolved) {
      throw new Error("Market already resolved");
    }

    await tx
      .update(markets)
      .set({ resolved: true, resolution })
      .where(eq(markets.id, id));

    const holders = await tx
      .select()
      .from(positions)
      .where(eq(positions.marketId, id));

    for (const holder of holders) {
      const winningShares =
        resolution === "YES" ? holder.yesShares : holder.noShares;

      const payout = Math.floor(winningShares);
      if (payout <= 0) continue;

      await tx
        .update(users)
        .set({ balance: sql`${users.balance} + ${payout}` })
        .where(eq(users.id, holder.userId));

      await tx.insert(ledger).values({
        userId: holder.userId,
        amount: payout,
        description: `Payout for market "${market.question}"`,
      });
    }
  });
}

export async function reverseResolution(
  id: number,
  newResolution: "YES" | "NO",
) {
  const token = getCookie("token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = await getUserFromToken(token);

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!user.admin) {
    throw new Error("Only admins can reverse resolutions");
  }

  await db.transaction(async (tx) => {
    const [market] = await tx
      .select()
      .from(markets)
      .where(eq(markets.id, id))
      .for("update");

    if (!market) {
      throw new Error("Market not found");
    }

    if (!market.resolved) {
      throw new Error("Market is not resolved");
    }

    const oldResolution = market.resolution;

    await tx
      .update(markets)
      .set({ resolution: newResolution })
      .where(eq(markets.id, id));

    const holders = await tx
      .select()
      .from(positions)
      .where(eq(positions.marketId, id));

    for (const holder of holders) {
      const oldPayout =
        oldResolution === "YES" ? holder.yesShares : holder.noShares;

      const newPayout =
        newResolution === "YES" ? holder.yesShares : holder.noShares;

      const delta = Math.floor(newPayout - oldPayout);
      if (delta === 0) continue;

      await tx
        .update(users)
        .set({ balance: sql`${users.balance} + ${delta}` })
        .where(eq(users.id, holder.userId));

      await tx.insert(ledger).values({
        userId: holder.userId,
        amount: delta,
        description: `Resolution reversed (${oldResolution} -> ${newResolution}) for market "${market.question}"`,
      });
    }
  });
}
