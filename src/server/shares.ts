"use server";

import { getCookie } from "vinxi/http";
import { getUserFromToken } from "./auth";
import { db } from "./db";
import { ledger, markets, positions, trades, users } from "./db/schema";
import { and, eq, sql } from "drizzle-orm";
import {
  floorPoints,
  priceAfterTrade,
  sellProceeds,
  sharesForSpend,
} from "~/lib/lmsr";

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

  if (user.banned) {
    throw new Error("User is banned");
  }

  if (spend > user.balance) {
    throw new Error("Insufficient balance");
  }

  await db.transaction(async (tx) => {
    const [market] = await tx
      .select()
      .from(markets)
      .where(eq(markets.id, marketId))
      .for("update");

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

    await tx
      .update(users)
      .set({ balance: sql`${users.balance} - ${spend}` })
      .where(eq(users.id, user.id));

    await tx
      .update(markets)
      .set({
        qYes: newYes,
        qNo: newNo,
        volume: sql`${markets.volume} + ${spend}`,
      })
      .where(eq(markets.id, marketId));

    await tx
      .insert(positions)
      .values({
        userId: user.id,
        marketId,
        yesShares: yesAdd,
        noShares: noAdd,
        yesSpent: outcome === "YES" ? spend : 0,
        noSpent: outcome === "NO" ? spend : 0,
      })
      .onConflictDoUpdate({
        target: [positions.userId, positions.marketId],
        set: {
          yesShares: sql`${positions.yesShares} + ${yesAdd}`,
          noShares: sql`${positions.noShares} + ${noAdd}`,
          yesSpent: sql`${positions.yesSpent} + ${outcome === "YES" ? spend : 0}`,
          noSpent: sql`${positions.noSpent} + ${outcome === "NO" ? spend : 0}`,
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

    await tx.insert(ledger).values({
      userId: user.id,
      amount: -spend,
      description: `Bought ${shares.toFixed(2)} ${outcome} on market #${marketId}`,
    });
  });
}

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

export async function sellShares({
  marketId,
  outcome,
}: {
  marketId: number;
  outcome: "YES" | "NO";
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
    throw new Error("User is banned");
  }

  await db.transaction(async (tx) => {
    const [market] = await tx
      .select()
      .from(markets)
      .where(eq(markets.id, marketId))
      .for("update");

    if (!market) {
      throw new Error("Market not found");
    }

    if (market.resolved) {
      throw new Error("Market already resolved");
    }

    const [position] = await tx
      .select()
      .from(positions)
      .where(
        and(eq(positions.marketId, marketId), eq(positions.userId, user.id)),
      )
      .for("update");

    if (!position) {
      throw new Error("No shares to sell");
    }

    const userShares =
      outcome === "YES" ? position.yesShares : position.noShares;

    if (userShares == 0) {
      throw new Error("No shares to sell");
    }

    const newYes = outcome === "YES" ? market.qYes - userShares : market.qYes;
    const newNo = outcome === "NO" ? market.qNo - userShares : market.qNo;

    const proceeds = floorPoints(
      sellProceeds(market.b, market.qYes, market.qNo, outcome, userShares),
    );

    await tx
      .update(users)
      .set({ balance: sql`${users.balance} + ${proceeds}` })
      .where(eq(users.id, user.id));

    await tx
      .update(markets)
      .set({
        qYes: newYes,
        qNo: newNo,
        volume: sql`${markets.volume} + ${proceeds}`,
      })
      .where(eq(markets.id, marketId));

    await tx
      .update(positions)
      .set({
        yesShares: outcome === "YES" ? 0 : position.yesShares,
        noShares: outcome === "NO" ? 0 : position.noShares,
        yesSpent: sql`greatest(${positions.yesShares} - ${outcome === "YES" ? userShares : 0}, 0)`,
        noSpent: sql`greatest(${positions.noShares} - ${outcome === "NO" ? userShares : 0}, 0)`,
      })
      .where(
        and(eq(positions.marketId, marketId), eq(positions.userId, user.id)),
      );

    await tx.insert(trades).values({
      userId: user.id,
      marketId,
      outcome,
      shares: -userShares,
      probAfter: priceAfterTrade(
        market.b,
        market.qYes,
        market.qNo,
        outcome,
        -userShares,
      ),
      price: proceeds,
    });

    await tx.insert(ledger).values({
      userId: user.id,
      amount: proceeds,
      description: `Sold ${userShares.toFixed(2)} ${outcome} on market #${marketId}`,
    });
  });
}
