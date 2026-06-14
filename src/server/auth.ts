import { and, eq, gt, or } from "drizzle-orm";
import bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { db } from "./db";
import { ledger, sessions, users } from "./db/schema";
import { getCookie, setCookie } from "vinxi/http";
import { query, redirect } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";

export async function login(username: string, password: string) {
  "use server";

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username));

  if (!user) {
    throw new Error("Invalid username or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    throw new Error("Invalid username or password");
  }

  const token = randomBytes(32).toString("hex");
  const sha256 = createHash("sha256").update(token).digest();

  await db.insert(sessions).values({
    userId: user.id,
    token: sha256,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  setCookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

export async function register(
  username: string,
  email: string,
  password: string,
) {
  "use server";

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, email)));

  if (existing) {
    throw new Error("Username or email already exists");
  }

  const hashed = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({ username, email, passwordHash: hashed })
    .returning();

  const token = randomBytes(32).toString("hex");
  const sha256 = createHash("sha256").update(token).digest();

  await db.insert(sessions).values({
    userId: user.id,
    token: sha256,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  setCookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30, // 1 month
  });

  await db.insert(ledger).values({
    userId: user.id,
    amount: 1000,
    description: "Initial balance",
  });
}

export async function getUserFromToken(token: string) {
  "use server";
  const sha256 = createHash("sha256").update(token).digest();

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      balance: users.balance,
      admin: users.admin,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.token, sha256),
        gt(sessions.expiresAt, new Date().toISOString()),
      ),
    );

  return user || null;
}

export async function getUser() {
  "use server";

  let token = getCookie("token");

  if (!token) {
    const req = getRequestEvent()?.request;
    const cookieHeader = req?.headers.get("cookie") ?? "";
    token = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/)?.[1];
  }

  if (!token) return null;

  return getUserFromToken(token);
}

export async function requireUser() {
  "use server";

  const user = await getUser();

  if (!user) {
    throw redirect("/login");
  }

  return user;
}
