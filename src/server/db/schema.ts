import {
  boolean,
  customType,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
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
  admin: boolean("admin").notNull().default(false),
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
  qYes: doublePrecision("q_yes").notNull().default(0), // yes shares
  qNo: doublePrecision("q_no").notNull().default(0), // no shares
  volume: integer("volume").notNull().default(0),
  resolved: boolean("resolved").notNull().default(false),
  resolution: text("resolution", { enum: ["YES", "NO"] }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const positions = pgTable(
  "positions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    marketId: integer("market_id")
      .notNull()
      .references(() => markets.id),
    yesShares: doublePrecision("yes_shares").notNull().default(0),
    noShares: doublePrecision("no_shares").notNull().default(0),
    totalSpent: integer("total_spent").notNull().default(0),
  },
  (t) => [uniqueIndex("positions_user_market_idx").on(t.userId, t.marketId)],
);

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  marketId: integer("market_id")
    .notNull()
    .references(() => markets.id),
  outcome: text("outcome", { enum: ["YES", "NO"] }).notNull(),
  shares: doublePrecision("shares").notNull(),
  price: integer("price").notNull(),
  probAfter: doublePrecision("prob_after").notNull(), // makes charting easier, also so we dont have to do lsmr math so much and can just do when trade made
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ledger = pgTable("ledger", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Market = typeof markets.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type Trade = typeof trades.$inferSelect;
