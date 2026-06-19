"use server";

import { and, desc, eq, gt, or } from "drizzle-orm";
import { db } from "./db";
import { ledger, markets, positions, users } from "./db/schema";

export async function getUser(id: number) {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      balance: users.balance,
      banned: users.banned,
    })
    .from(users)
    .where(eq(users.id, id));

  if (!user) {
    return null;
  }

  const pos = await db
    .select({
      marketId: positions.marketId,
      market: markets.question,
      resolved: markets.resolved,
      resolution: markets.resolution,
      yesShares: positions.yesShares,
      noShares: positions.noShares,
      yesSpent: positions.yesSpent,
      noSpent: positions.noSpent,
    })
    .from(positions)
    .where(
      and(
        eq(positions.userId, id),
        or(gt(positions.yesShares, 0), gt(positions.noShares, 0)),
      ),
    )
    .innerJoin(markets, eq(positions.marketId, markets.id));

  const ledgerRecent = await db
    .select({
      amount: ledger.amount,
      description: ledger.description,
      createdAt: ledger.createdAt,
    })
    .from(ledger)
    .where(eq(ledger.userId, id))
    .orderBy(desc(ledger.createdAt))
    .limit(10);

  return { ...user, positions: pos, ledgerRecent };
}
