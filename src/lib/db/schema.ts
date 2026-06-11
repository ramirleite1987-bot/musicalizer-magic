import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type {
  TrackStyle,
  DimensionScores,
  TrackFeedback,
} from "@/types/music";

export const trackStatusEnum = pgEnum("track_status", [
  "draft",
  "generating",
  "complete",
  "archived",
]);

export const themeSourceEnum = pgEnum("theme_source", [
  "manual",
  "url",
  "document",
]);

// --- Tables ---

export const tracks = pgTable(
  "tracks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Clerk user id; nullable so pre-auth rows can be claimed by the first user
    userId: text("user_id"),
    name: varchar("name", { length: 255 }).notNull(),
    genre: varchar("genre", { length: 100 }).notNull(),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("tracks_user_id_idx").on(table.userId)]
);

export const trackVersions = pgTable("track_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  trackId: uuid("track_id")
    .references(() => tracks.id, { onDelete: "cascade" })
    .notNull(),
  versionNumber: integer("version_number").notNull(),
  status: trackStatusEnum("status").default("draft").notNull(),
  prompt: text("prompt").default("").notNull(),
  negativePrompt: text("negative_prompt").default("").notNull(),
  lyrics: text("lyrics").default("").notNull(),
  style: jsonb("style").$type<TrackStyle>().notNull(),
  rating: integer("rating").default(0).notNull(),
  dimensionScores: jsonb("dimension_scores")
    .$type<DimensionScores>()
    .notNull(),
  notes: text("notes").default("").notNull(),
  feedback: jsonb("feedback").$type<TrackFeedback>().notNull(),
  isBest: boolean("is_best").default(false).notNull(),
  audioFileName: varchar("audio_file_name", { length: 500 }),
  audioUrl: varchar("audio_url", { length: 1000 }),
  sunoTaskId: varchar("suno_task_id", { length: 255 }),
  provider: varchar("provider", { length: 32 }).default("suno").notNull(),
  providerTaskId: varchar("provider_task_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const themes = pgTable(
  "themes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id"),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").default("").notNull(),
    keywords: jsonb("keywords").$type<string[]>().default([]).notNull(),
    color: varchar("color", { length: 50 }).notNull(),
    source: themeSourceEnum("source").default("manual").notNull(),
    sourceRef: text("source_ref").default("").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("themes_user_id_idx").on(table.userId)]
);

export const stylePresets = pgTable(
  "style_presets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id"),
    name: varchar("name", { length: 255 }).notNull(),
    style: jsonb("style").$type<TrackStyle>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("style_presets_user_id_idx").on(table.userId)]
);

export const trackThemes = pgTable(
  "track_themes",
  {
    trackId: uuid("track_id")
      .references(() => tracks.id, { onDelete: "cascade" })
      .notNull(),
    themeId: uuid("theme_id")
      .references(() => themes.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.trackId, table.themeId] })]
);

// --- Relations ---

export const tracksRelations = relations(tracks, ({ many }) => ({
  versions: many(trackVersions),
  trackThemes: many(trackThemes),
}));

export const trackVersionsRelations = relations(trackVersions, ({ one }) => ({
  track: one(tracks, {
    fields: [trackVersions.trackId],
    references: [tracks.id],
  }),
}));

export const themesRelations = relations(themes, ({ many }) => ({
  trackThemes: many(trackThemes),
}));

export const trackThemesRelations = relations(trackThemes, ({ one }) => ({
  track: one(tracks, {
    fields: [trackThemes.trackId],
    references: [tracks.id],
  }),
  theme: one(themes, {
    fields: [trackThemes.themeId],
    references: [themes.id],
  }),
}));

export const generationLogs = pgTable(
  "generation_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id"),
    trackId: uuid("track_id"),
    versionId: uuid("version_id"),
    provider: varchar("provider", { length: 32 }).notNull(),
    model: varchar("model", { length: 64 }),
    status: varchar("status", { length: 32 }).notNull(),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("generation_logs_user_id_idx").on(table.userId)]
);

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id"),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").default("").notNull(),
    category: varchar("category", { length: 50 }).default("general").notNull(), // 'lyrics' | 'prompt' | 'general'
    instructions: text("instructions").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("skills_user_id_idx").on(table.userId)]
);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(), // Clerk user id
  displayName: varchar("display_name", { length: 255 }),
  llmProvider: varchar("llm_provider", { length: 32 })
    .default("openrouter")
    .notNull(), // 'openrouter' | 'minimax'
  llmModel: varchar("llm_model", { length: 128 }),
  defaultMusicProvider: varchar("default_music_provider", { length: 32 })
    .default("suno")
    .notNull(),
  defaultGenre: varchar("default_genre", { length: 100 }),
  // API keys encrypted at rest with AES-256-GCM (see src/lib/crypto.ts)
  openrouterKeyEnc: text("openrouter_key_enc"),
  minimaxKeyEnc: text("minimax_key_enc"),
  sunoKeyEnc: text("suno_key_enc"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
