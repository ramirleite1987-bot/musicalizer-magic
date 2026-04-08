CREATE TYPE "public"."theme_source" AS ENUM('manual', 'url', 'document');--> statement-breakpoint
CREATE TYPE "public"."track_status" AS ENUM('draft', 'generating', 'complete', 'archived');--> statement-breakpoint
CREATE TABLE "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"color" varchar(50) NOT NULL,
	"source" "theme_source" DEFAULT 'manual' NOT NULL,
	"source_ref" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "track_themes" (
	"track_id" uuid NOT NULL,
	"theme_id" uuid NOT NULL,
	CONSTRAINT "track_themes_track_id_theme_id_pk" PRIMARY KEY("track_id","theme_id")
);
--> statement-breakpoint
CREATE TABLE "track_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"status" "track_status" DEFAULT 'draft' NOT NULL,
	"prompt" text DEFAULT '' NOT NULL,
	"negative_prompt" text DEFAULT '' NOT NULL,
	"lyrics" text DEFAULT '' NOT NULL,
	"style" jsonb NOT NULL,
	"rating" integer DEFAULT 0 NOT NULL,
	"dimension_scores" jsonb NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"feedback" jsonb NOT NULL,
	"is_best" boolean DEFAULT false NOT NULL,
	"audio_file_name" varchar(500),
	"audio_url" varchar(1000),
	"suno_task_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"genre" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "track_themes" ADD CONSTRAINT "track_themes_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_themes" ADD CONSTRAINT "track_themes_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_versions" ADD CONSTRAINT "track_versions_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;