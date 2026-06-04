CREATE TABLE "generation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"provider" varchar(32) NOT NULL,
	"model_label" varchar(64) NOT NULL,
	"status" varchar(16) DEFAULT 'started' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"latency_ms" integer,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "generation_events" ADD CONSTRAINT "generation_events_version_id_track_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."track_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "generation_events_version_id_idx" ON "generation_events" ("version_id");--> statement-breakpoint
CREATE INDEX "generation_events_provider_started_at_idx" ON "generation_events" ("provider","started_at");
