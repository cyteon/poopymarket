import { desc, eq, ne, sql, sum } from "drizzle-orm";
import { db } from "./db";
import { ledger, markets, sessions, trades, users } from "./db/schema";
import { getCookie } from "vinxi/http";
import { getUserFromToken } from "./auth";
import { query, redirect } from "@solidjs/router";

export async function getOverview() {
  "use server";

  const token = getCookie("token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = await getUserFromToken(token);

  if (!user || !user.admin) {
    throw new Error("Unauthorized");
  }

  const [totalVolume] = await db
    .select({ totalVolume: sum(sql`abs(${trades.price})`).mapWith(Number) })
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
  "use server";

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
    .orderBy(users.banned, users.id);

  return usersData;
}

export async function adjustBalance(userId: number, amount: number) {
  "use server";

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
  "use server";

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

export async function getMarkets() {
  "use server";

  const token = getCookie("token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = await getUserFromToken(token);

  if (!user || !user.admin) {
    throw new Error("Unauthorized");
  }

  const marketsData = await db
    .select({
      id: markets.id,
      creator: users.username,
      question: markets.question,
      resolved: markets.resolved,
      resolution: markets.resolution,
      volume: markets.volume,
    })
    .from(markets)
    .leftJoin(users, eq(users.id, markets.creatorId))
    .orderBy(markets.resolved, markets.id);

  return marketsData;
}

// this will be large so pagination needed
export async function getTrades(page: number) {
  "use server";

  const token = getCookie("token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = await getUserFromToken(token);

  if (!user || !user.admin) {
    throw new Error("Unauthorized");
  }

  const tradesData = await db
    .select({
      id: trades.id,
      market: trades.marketId,
      user: users.username,
      outcome: trades.outcome,
      price: trades.price,
      shares: trades.shares,
      createdAt: trades.createdAt,
    })
    .from(trades)
    .leftJoin(users, eq(users.id, trades.userId))
    .orderBy(desc(trades.id))
    .limit(100)
    .offset((page - 1) * 100);

  const pageCount = Math.ceil((await db.$count(trades)) / 100);

  return { d: tradesData, pageCount };
}

export async function getLedger(page: number) {
  "use server";

  const token = getCookie("token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = await getUserFromToken(token);

  if (!user || !user.admin) {
    throw new Error("Unauthorized");
  }

  const ledgerData = await db
    .select({
      id: ledger.id,
      user: users.username,
      amount: ledger.amount,
      description: ledger.description,
      createdAt: ledger.createdAt,
    })
    .from(ledger)
    .leftJoin(users, eq(users.id, ledger.userId))
    .orderBy(desc(ledger.id))
    .limit(100)
    .offset((page - 1) * 100);

  const pageCount = Math.ceil((await db.$count(ledger)) / 100);

  return { d: ledgerData, pageCount };
}

export async function getSuspectedAlts() {
  const rows = await db
    .selectDistinct({
      ip: sessions.ip,
      userId: sessions.userId,
      username: users.username,
      banned: users.banned,
    })
    .from(sessions)
    .leftJoin(users, eq(users.id, sessions.userId))
    .orderBy(sessions.ip)
    .where(ne(sessions.ip, "unknown"));

  const byIp = new Map<
    string,
    { userId: number; username: string; banned: boolean }[]
  >();

  for (const row of rows) {
    const list = byIp.get(row.ip) ?? [];
    list.push({
      userId: row.userId,
      username: row.username || "<none>",
      banned: row.banned || false,
    });
    byIp.set(row.ip, list);
  }

  let result: {
    suspected_owner: string;
    ip: string;
    users: {
      userId: number;
      username: string;
      banned: boolean;
    }[];
  }[] = [];

  for (const [ip, users] of byIp.entries()) {
    if (users.length < 1) continue;

    users.sort((a, b) => a.userId - b.userId);

    result.push({
      suspected_owner: users[0].username,
      ip,
      users,
    });
  }

  return result;
}

export const requireAdmin = query(async () => {
  "use server";
  const token = getCookie("token");

  if (!token) {
    throw redirect("/login");
  }

  const user = await getUserFromToken(token);

  if (!user || !user.admin) {
    throw redirect("/login");
  }

  return user;
}, "requireAdmin");
