import { desc } from "drizzle-orm";
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
    .limit(10);

  return result;
}
