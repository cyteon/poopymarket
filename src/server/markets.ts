"use server";

import { getCookie } from "vinxi/http";
import { getUserFromToken } from "./auth";
import { markets, users } from "./db/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
  const [market] = await db
    .select()
    .from(markets)
    .where(eq(markets.id, id))
    .execute();

  return market;
}

export async function getMarkets() {
  return await db.select().from(markets).execute();
}
