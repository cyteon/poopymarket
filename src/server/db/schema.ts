import { customType, pgTable, serial, text } from "drizzle-orm/pg-core";

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
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: bytea("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
});
