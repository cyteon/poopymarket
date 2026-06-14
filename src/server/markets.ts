"use server";

import { getCookie } from "vinxi/http";
import { getUserFromToken } from "./auth";
import { ledger, markets, positions, trades, users } from "./db/schema";
import { db } from "./db";
import { asc, desc, eq, sql } from "drizzle-orm";

export async function createMarket(question: string, rules: string) {
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

  if (user.balance < 500) {
    throw new Error("Insufficient balance");
  }

  const [market] = await db
    .insert(markets)
    .values({
      question,
      rules,
      creatorId: user.id,
      b: 2000,
    })
    .returning();

  await db
    .update(users)
    .set({ balance: user.balance - 500 })
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

  return { ...market, points };
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
      const payout = Math.floor(winningShares * 0.95);
      if (payout <= 0) continue;

      await tx
        .update(users)
        .set({ balance: sql`${users.balance} + ${payout}` })
        .where(eq(users.id, holder.userId));

      await tx.insert(ledger).values({
        userId: holder.userId,
        amount: payout,
        description: `Payout for market ${market.question}`,
      });
    }
  });
}
