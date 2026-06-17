import { db } from "./db";
import { ledger, markets, positions, trades, User, users } from "./db/schema";
import { and, eq, sql } from "drizzle-orm";
import {
  floorPoints,
  priceAfterTrade,
  sellProceeds,
  sharesForSpend,
} from "~/lib/lmsr";

export async function buySharesForUser({
  user,
  marketId,
  outcome,
  spend,
  minShares,
}: {
  user: Omit<User, "passwordHash">;
  marketId: number;
  outcome: "YES" | "NO";
  spend: number;
  minShares: number;
}) {
  return await db.transaction(async (tx) => {
    [user] = await tx
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .for("update");

    if (user.balance < spend) {
      throw new Error("Insufficient balance");
    }

    if (user.banned) {
      throw new Error("User is banned");
    }

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

    return { bought: shares, probAfter };
  });
}

export async function sellSharesForUser({
  user,
  marketId,
  outcome,
  minValue,
}: {
  user: Omit<User, "passwordHash">;
  marketId: number;
  outcome: "YES" | "NO";
  minValue: number;
}) {
  return await db.transaction(async (tx) => {
    [user] = await tx
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .for("update");

    if (user.banned) {
      throw new Error("User is banned");
    }

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

    if (proceeds < minValue * 0.99) {
      throw new Error(">1% slippage, refresh and try again");
    }

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
        yesSpent: outcome === "YES" ? 0 : position.yesSpent,
        noSpent: outcome === "NO" ? 0 : position.noSpent,
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
      price: -proceeds,
    });

    await tx.insert(ledger).values({
      userId: user.id,
      amount: proceeds,
      description: `Sold ${userShares.toFixed(2)} ${outcome} on market #${marketId}`,
    });

    return {
      sold: userShares,
      proceeds,
      originalSpent: outcome === "YES" ? position.yesSpent : position.noSpent,
    };
  });
}
