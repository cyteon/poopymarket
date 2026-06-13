"use server";

import { getCookie } from "vinxi/http";
import { getUserFromToken } from "./auth";
import { db } from "./db";
import { markets, positions, trades, users } from "./db/schema";
import { eq, sql } from "drizzle-orm";
import { priceAfterTrade, sharesForSpend } from "~/lib/lmsr";

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

  if (spend > user.balance) {
    throw new Error("Insufficient balance");
  }

  const [market] = await db
    .select()
    .from(markets)
    .where(eq(markets.id, marketId))
    .execute();

  if (!market) {
    throw new Error("Market not found");
  }

  if (market.resolved) {
    throw new Error("Market already resolved");
  }

  const shares = sharesForSpend(
    market.b,
    market.qYes,
    market.qNo,
    outcome,
    spend,
  );

  if (shares < Math.floor(minShares * 0.99)) {
    throw new Error(">1% slippage, refresh and try again");
  }

  const newYes = outcome === "YES" ? market.qYes + shares : market.qYes;
  const newNo = outcome === "NO" ? market.qNo + shares : market.qNo;
  const probAfter = priceAfterTrade(
    market.b,
    market.qYes,
    market.qNo,
    outcome,
    shares,
  );

  const yesAdd = outcome === "YES" ? shares : 0;
  const noAdd = outcome === "NO" ? shares : 0;

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ balance: sql`${users.balance} - ${spend}` })
      .where(eq(users.id, user.id));

    await tx
      .update(markets)
      .set({ qYes: newYes, qNo: newNo })
      .where(eq(markets.id, marketId));

    await tx
      .insert(positions)
      .values({
        userId: user.id,
        marketId,
        yesShares: yesAdd,
        noShares: noAdd,
        totalSpent: spend,
      })
      .onConflictDoUpdate({
        target: [positions.userId, positions.marketId],
        set: {
          yesShares: sql`${positions.yesShares} + ${yesAdd}`,
          noShares: sql`${positions.noShares} + ${noAdd}`,
          totalSpent: sql`${positions.totalSpent} + ${spend}`,
        },
      });

    await tx.insert(trades).values({
      userId: user.id,
      marketId,
      outcome,
      shares,
      probAfter,
      price: spend,
    });
  });
}
