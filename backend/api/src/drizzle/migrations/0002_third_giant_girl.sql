CREATE TYPE "public"."upload_session_status" AS ENUM('initiated', 'in_progress', 'completed', 'aborted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."video_processing_status" AS ENUM('awaiting_upload', 'uploading', 'uploaded', 'transcoding', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "lesson_posters" (
	"lessonId" uuid PRIMARY KEY NOT NULL,
	"sourceOffsetSeconds" integer DEFAULT 0 NOT NULL,
	"isCustom" boolean DEFAULT false NOT NULL,
	"objectKey" varchar(1024) NOT NULL,
	"width" integer,
	"height" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_videos" (
	"lessonId" uuid PRIMARY KEY NOT NULL,
	"sourceObjectKey" varchar(1024) NOT NULL,
	"sourceSizeBytes" integer,
	"sourceMimeType" varchar(100),
	"status" "video_processing_status" DEFAULT 'awaiting_upload' NOT NULL,
	"failureReason" text,
	"processingProgressPercent" integer DEFAULT 0 NOT NULL,
	"durationSeconds" integer DEFAULT 0 NOT NULL,
	"width" integer,
	"height" integer,
	"transcodeVersion" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"readyAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "upload_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lessonId" uuid NOT NULL,
	"uploadId" varchar(512) NOT NULL,
	"status" "upload_session_status" DEFAULT 'initiated' NOT NULL,
	"bucket" varchar(255) NOT NULL,
	"objectKey" varchar(1024) NOT NULL,
	"contentType" varchar(100),
	"totalSizeBytes" integer,
	"totalParts" integer,
	"partSizeBytes" integer,
	"bytesUploaded" integer DEFAULT 0 NOT NULL,
	"failureReason" text,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone,
	"abortedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "video_renditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lessonVideoId" uuid NOT NULL,
	"height" integer NOT NULL,
	"playlistObjectKey" varchar(1024) NOT NULL,
	"videoBitrateKbps" integer,
	"audioBitrateKbps" integer,
	"codec" varchar(50) DEFAULT 'h264' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "thumbnailUrl" varchar(2048);--> statement-breakpoint
ALTER TABLE "lesson_posters" ADD CONSTRAINT "lesson_posters_lessonId_lessons_id_fk" FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_videos" ADD CONSTRAINT "lesson_videos_lessonId_lessons_id_fk" FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_lessonId_lessons_id_fk" FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_renditions" ADD CONSTRAINT "video_renditions_lessonVideoId_lesson_videos_lessonId_fk" FOREIGN KEY ("lessonVideoId") REFERENCES "public"."lesson_videos"("lessonId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_posters_custom_idx" ON "lesson_posters" USING btree ("lessonId") WHERE "lesson_posters"."isCustom" = true;--> statement-breakpoint
CREATE INDEX "lesson_videos_transcode_queue_idx" ON "lesson_videos" USING btree ("status","createdAt") WHERE "lesson_videos"."status" in ('uploaded', 'transcoding');--> statement-breakpoint
CREATE INDEX "lesson_videos_failed_idx" ON "lesson_videos" USING btree ("updatedAt") WHERE "lesson_videos"."status" = 'failed';--> statement-breakpoint
CREATE INDEX "lesson_videos_ready_idx" ON "lesson_videos" USING btree ("lessonId") WHERE "lesson_videos"."status" = 'ready';--> statement-breakpoint
CREATE UNIQUE INDEX "upload_sessions_active_lesson_unique_idx" ON "upload_sessions" USING btree ("lessonId") WHERE "upload_sessions"."status" in ('initiated', 'in_progress');--> statement-breakpoint
CREATE INDEX "upload_sessions_expiry_idx" ON "upload_sessions" USING btree ("expiresAt") WHERE "upload_sessions"."status" in ('initiated', 'in_progress');--> statement-breakpoint
CREATE INDEX "upload_sessions_lesson_idx" ON "upload_sessions" USING btree ("lessonId");--> statement-breakpoint
CREATE UNIQUE INDEX "video_renditions_lesson_height_unique_idx" ON "video_renditions" USING btree ("lessonVideoId","height");