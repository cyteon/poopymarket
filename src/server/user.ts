"use server";

import { getCookie } from "vinxi/http";
import { getUserFromToken } from "./auth";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export async function claimDailyCredits() {
  const token = getCookie("token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  let user = await getUserFromToken(token);

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.banned) {
    throw new Error("Your account has been banned");
  }

  await db.transaction(async (tx) => {
    [user] = await tx
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .for("update");

    const todayDate = new Date().toISOString().split("T")[0];
    const lastDailyDate = new Date(user.lastDaily).toISOString().split("T")[0];

    if (todayDate === lastDailyDate) {
      throw new Error("You have already claimed your daily credits");
    }

    await tx
      .update(users)
      .set({
        balance: user.balance + 100,
        lastDaily: new Date(),
      })
      .where(eq(users.id, user.id));
  });
}
