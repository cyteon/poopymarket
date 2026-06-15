"use server";

import { eq, sql, sum } from "drizzle-orm";
import { db } from "./db";
import { ledger, markets, trades, users } from "./db/schema";
import { getCookie } from "vinxi/http";
import { getUserFromToken } from "./auth";

export async function getOverview() {
  const token = getCookie("token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = await getUserFromToken(token);

  if (!user || !user.admin) {
    throw new Error("Unauthorized");
  }

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

export async function getUsers() {
  const token = getCookie("token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = await getUserFromToken(token);

  if (!user || !user.admin) {
    throw new Error("Unauthorized");
  }

  const usersData = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      balance: users.balance,
      admin: users.admin,
      banned: users.banned,
    })
    .from(users)
    .orderBy(users.id);

  return usersData;
}

export async function adjustBalance(userId: number, amount: number) {
  const token = getCookie("token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = await getUserFromToken(token);

  if (!user || !user.admin) {
    throw new Error("Unauthorized");
  }

  await db
    .update(users)
    .set({ balance: sql`${users.balance} + ${amount}` })
    .where(eq(users.id, userId));

  await db.insert(ledger).values({
    userId,
    amount,
    description: "Balance adjusted by admin",
  });
}

export async function toggleBanned(userId: number) {
  const token = getCookie("token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = await getUserFromToken(token);

  if (!user || !user.admin) {
    throw new Error("Unauthorized");
  }

  const [targetUser] = await db
    .select({ banned: users.banned })
    .from(users)
    .where(eq(users.id, userId));

  if (!targetUser) {
    throw new Error("User not found");
  }

  await db
    .update(users)
    .set({ banned: !targetUser.banned })
    .where(eq(users.id, userId));
}
