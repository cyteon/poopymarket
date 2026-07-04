"use server";

import { getCookie } from "vinxi/http";
import { getUserFromToken } from "./auth";
import { db } from "./db";
import { ledger, notifications, users } from "./db/schema";
import { desc, eq } from "drizzle-orm";

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

    await tx.insert(ledger).values({
      userId: user.id,
      amount: 100,
      description: "Daily credits claim",
    });
  });
}

export async function getNotifications() {
  const token = getCookie("token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = await getUserFromToken(token);

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.banned) {
    throw new Error("Your account has been banned");
  }

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt));
}

export async function markAllNotifsRead() {
  const token = getCookie("token");

  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = await getUserFromToken(token);

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.banned) {
    throw new Error("Your account has been banned");
  }

  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, user.id));
}
