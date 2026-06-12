import {
  boolean,
  customType,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const citext = customType<{ data: string }>({
  dataType: () => "citext",
});

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: citext("email").notNull().unique(),
  username: citext("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  balance: integer("balance").notNull().default(1000),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: bytea("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
});

export const markets = pgTable("markets", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  rules: text("rules").notNull(),
  creatorId: integer("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  b: integer("b").notNull().default(250), // liquidity
  qYes: integer("q_yes").notNull().default(0), // yes shares
  qNo: integer("q_no").notNull().default(0), // no shares
  resolved: boolean("resolved").notNull().default(false),
  resolution: text("resolution", { enum: ["yes", "no"] }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
