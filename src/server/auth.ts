import { and, desc, eq, gt, or } from "drizzle-orm";
import bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { db } from "./db";
import { ledger, passwordResets, sessions, users } from "./db/schema";
import { getCookie, getHeader, getRequestIP, setCookie } from "vinxi/http";
import { query, redirect } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { isDisposableEmail } from "disposable-email-domains-js";
import { resolveMx } from "dns/promises";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function login(identifier: string, password: string) {
  "use server";

  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.username, identifier), eq(users.email, identifier)));

  if (!user) {
    throw new Error("Invalid username/email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    throw new Error("Invalid username or password");
  }

  const token = randomBytes(32).toString("hex");
  const sha256 = createHash("sha256").update(token).digest();

  const clientInfo = await getClientInfo();

  await db.insert(sessions).values({
    userId: user.id,
    token: sha256,
    ip: clientInfo.ip,
    userAgent: clientInfo.userAgent,
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

  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!regex.test(email)) {
    throw new Error("Invalid email address");
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, email)));

  if (existing) {
    throw new Error("Username or email already exists");
  }

  if (isDisposableEmail(email)) {
    throw new Error("Invalid email address");
  }

  try {
    const records = await resolveMx(email.split("@")[1]);

    if (records.length === 0) {
      throw new Error("Invalid email address");
    }
  } catch {
    throw new Error("Invalid email address");
  }

  const hashed = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({ username, email, passwordHash: hashed })
    .returning();

  const token = randomBytes(32).toString("hex");
  const sha256 = createHash("sha256").update(token).digest();

  const clientInfo = await getClientInfo();

  await db.insert(sessions).values({
    userId: user.id,
    token: sha256,
    ip: clientInfo.ip,
    userAgent: clientInfo.userAgent,
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
      banned: users.banned,
      lastDaily: users.lastDaily,
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

export async function sendPasswordResetEmail(email: string) {
  "use server";

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    return;
  }

  const [latestExisting] = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.userId, user.id),
        gt(passwordResets.expiresAt, new Date().toISOString()),
      ),
    )
    .orderBy(desc(passwordResets.createdAt));

  if (
    latestExisting &&
    Date.now() - new Date(latestExisting.createdAt).getTime() < 5 * 60 * 1000
  ) {
    throw new Error("Try again in 5 minutes");
  }

  const token = randomBytes(32).toString("hex");
  const sha256 = createHash("sha256").update(token).digest();

  await db.insert(passwordResets).values({
    userId: user.id,
    token: sha256,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
  });

  const resetLink = `${process.env.BASE_URL}/login/reset?token=${token}`;
  const body = `Hello ${user.username},\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nIf you didn't request this, you can ignore this email, but never send anyone this link.`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      replyTo: process.env.SMTP_REPLYTO,
      to: user.email,
      subject: "Password Reset for Poopymarket",
      text: body,
    });

    console.log(`Sent password reset email to ${user.email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}

export async function resetPassword(token: string, newPassword: string) {
  "use server";

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  const sha256 = createHash("sha256").update(token).digest();

  const [reset] = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.token, sha256),
        gt(passwordResets.expiresAt, new Date().toISOString()),
      ),
    );

  if (!reset) {
    throw new Error("Invalid or expired token");
  }

  const hashed = await bcrypt.hash(newPassword, 12);

  await db
    .update(users)
    .set({ passwordHash: hashed })
    .where(eq(users.id, reset.userId));

  await db
    .delete(passwordResets)
    .where(eq(passwordResets.userId, reset.userId));
}

export const getUser = query(async () => {
  "use server";

  let token = getCookie("token");

  if (!token) {
    const req = getRequestEvent()?.request;
    const cookieHeader = req?.headers.get("cookie") ?? "";
    token = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/)?.[1];
  }

  if (!token) return null;

  return getUserFromToken(token);
}, "user");

export const requireUser = query(async () => {
  "use server";

  const user = await getUser();

  if (!user) {
    throw redirect("/login");
  }

  if (user.banned) {
    throw redirect("/banned");
  }

  return user;
}, "requireUser");

async function getClientInfo() {
  const event = getRequestEvent()!.nativeEvent;

  const userAgent = getHeader(event, "user-agent") || "unknown";

  const ip =
    getRequestIP(event, { xForwardedFor: true }) ||
    getHeader(event, "x-forwarded-for")?.split(",")[0].trim() ||
    "unknown";

  return { userAgent, ip };
}
