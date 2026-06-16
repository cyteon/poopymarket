"use server";

import { desc, eq } from "drizzle-orm";
import { users } from "./db/schema";
import { db } from "./db";

export async function getTop10() {
  const result = await db
    .select({
      username: users.username,
      balance: users.balance,
    })
    .from(users)
    .orderBy(desc(users.balance))
    .where(eq(users.banned, false))
    .limit(10);

  return result;
}
