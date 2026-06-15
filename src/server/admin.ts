"use server";

import { sum } from "drizzle-orm";
import { db } from "./db";
import { markets, trades, users } from "./db/schema";

export async function getOverview() {
  const [totalVolume] = await db
    .select({ totalVolume: sum(trades.price).mapWith(Number) })
    .from(trades);

  const tradeCount = await db.$count(trades);
  const userCount = await db.$count(users);
  const marketCount = await db.$count(markets);

  return {
    totalVolume: totalVolume.totalVolume || 0,
    tradeCount: tradeCount || 0,
    userCount: userCount || 0,
    marketCount: marketCount || 0,
  };
}
