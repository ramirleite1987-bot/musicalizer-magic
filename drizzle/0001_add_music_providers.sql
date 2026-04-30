ALTER TABLE "track_versions" ADD COLUMN "provider" varchar(32) DEFAULT 'suno' NOT NULL;--> statement-breakpoint
ALTER TABLE "track_versions" ADD COLUMN "provider_task_id" varchar(255);--> statement-breakpoint
UPDATE "track_versions" SET "provider_task_id" = "suno_task_id" WHERE "provider_task_id" IS NULL AND "suno_task_id" IS NOT NULL;
