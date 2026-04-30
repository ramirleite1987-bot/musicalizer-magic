ALTER TABLE "track_versions" ADD COLUMN "provider" varchar(32) DEFAULT 'suno' NOT NULL;--> statement-breakpoint
ALTER TABLE "track_versions" ADD COLUMN "provider_task_id" varchar(255);
