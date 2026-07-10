import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  socialUrl: text("social_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const citations = sqliteTable("citations", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  author: text("author"),
  sourceRef: text("source_ref"),
  sourceType: text("source_type").notNull().$type<"bible" | "fiction">(),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  status: text("status")
    .notNull()
    .$type<"approved" | "pending" | "rejected" | "private">()
    .default("pending"),
  submittedByUserId: text("submitted_by_user_id").references(() => users.id, { onDelete: "set null" }),
  shareProfile: integer("share_profile", { mode: "boolean" }).notNull().default(false),
  moderatorNote: text("moderator_note"),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const savedCitations = sqliteTable(
  "saved_citations",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    citationId: text("citation_id")
      .notNull()
      .references(() => citations.id, { onDelete: "cascade" }),
    savedAt: integer("saved_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [primaryKey({ columns: [t.userId, t.citationId] })],
);

export const widgetSettings = sqliteTable("widget_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  sourceSelection: text("source_selection")
    .notNull()
    .$type<"bible" | "fiction" | "mixed" | "saved">()
    .default("mixed"),
  refreshRateHours: integer("refresh_rate_hours").notNull().default(24),
  fontStyle: text("font_style").notNull().$type<"source_serif_4" | "hanken_grotesk">().default("source_serif_4"),
  showAttribution: integer("show_attribution", { mode: "boolean" }).notNull().default(true),
  currentCitationId: text("current_citation_id").references(() => citations.id, { onDelete: "set null" }),
  currentCitationSetAt: integer("current_citation_set_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
