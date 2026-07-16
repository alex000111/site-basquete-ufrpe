import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  opponent: text("opponent").notNull(),
  gameDate: text("game_date").notNull(),
  gameTime: text("game_time").notNull().default(""),
  location: text("location").notNull(),
  competition: text("competition").notNull().default(""),
  status: text("status").notNull().default("Confirmado"),
  ruralScore: integer("rural_score").notNull().default(0),
  opponentScore: integer("opponent_score").notNull().default(0),
  summary: text("summary").notNull().default(""),
  youtubeUrl: text("youtube_url").notNull().default(""),
  period: integer("period").notNull().default(1),
  clockSeconds: integer("clock_seconds").notNull().default(600),
  clockRunning: integer("clock_running", { mode: "boolean" }).notNull().default(false),
  ruralFouls: integer("rural_fouls").notNull().default(0),
  opponentFouls: integer("opponent_fouls").notNull().default(0),
  ruralTimeouts: integer("rural_timeouts").notNull().default(0),
  opponentTimeouts: integer("opponent_timeouts").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const gameEvents = sqliteTable("game_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  points: integer("points").notNull().default(0),
  team: text("team").notNull().default("rural"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sumulaSignatures = sqliteTable("sumula_signatures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  dataUrl: text("data_url").notNull(),
  signedBy: text("signed_by").notNull().default(""),
  signedAt: text("signed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedBy: text("updated_by").notNull().default(""),
}, table => [
  uniqueIndex("sumula_signatures_game_role").on(table.gameId, table.role),
]);

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("staff"),
  passwordHash: text("password_hash").notNull(),
  mustChangePassword: integer("must_change_password", { mode: "boolean" }).notNull().default(true),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
