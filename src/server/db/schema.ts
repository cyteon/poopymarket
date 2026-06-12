import {
  boolean,
  customType,
  doublePrecision,
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
  userId: integer("user_id")
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

export const shares = pgTable("shares", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  marketId: integer("market_id")
    .notNull()
    .references(() => markets.id),
  yesShares: integer("yes_shares").notNull().default(0),
  noShares: integer("no_shares").notNull().default(0),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  marketId: integer("market_id")
    .notNull()
    .references(() => markets.id),
  outcome: text("outcome", { enum: ["yes", "no"] }).notNull(),
  shares: doublePrecision("shares").notNull(),
  price: integer("price").notNull(),
  probAfter: integer("prob_after").notNull(), // makes charting easier, also so we dont have to do lsmr math so much and can just do when trade made
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
