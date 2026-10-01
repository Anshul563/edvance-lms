CREATE TYPE "public"."creator_video_status" AS ENUM('draft', 'in_review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."creator_video_visibility" AS ENUM('public', 'unlisted', 'private');--> statement-breakpoint
CREATE TYPE "public"."video_reaction_type" AS ENUM('like', 'dislike');--> statement-breakpoint
CREATE TYPE "public"."discussion_vote_target" AS ENUM('thread', 'reply');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('new_video', 'course_update', 'enrollment', 'achievement', 'certificate', 'comment_reply', 'system');--> statement-breakpoint
CREATE TABLE "creator_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channelId" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"videoUrl" varchar(2048),
	"thumbnailUrl" varchar(2048),
	"durationSeconds" integer DEFAULT 0 NOT NULL,
	"status" "creator_video_status" DEFAULT 'draft' NOT NULL,
	"visibility" "creator_video_visibility" DEFAULT 'private' NOT NULL,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"likeCount" integer DEFAULT 0 NOT NULL,
	"dislikeCount" integer DEFAULT 0 NOT NULL,
	"commentCount" integer DEFAULT 0 NOT NULL,
	"publishedAt" timestamp with time zone,
	"archivedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "course_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"courseId" uuid NOT NULL,
	"rating" integer NOT NULL,
	"title" varchar(120),
	"body" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_reviews_rating_check" CHECK ("course_reviews"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"userId" uuid NOT NULL,
	"channelId" uuid NOT NULL,
	"notifyOnUpload" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_pk" PRIMARY KEY("userId","channelId")
);
--> statement-breakpoint
CREATE TABLE "video_reactions" (
	"userId" uuid NOT NULL,
	"videoId" uuid NOT NULL,
	"reaction" "video_reaction_type" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_reactions_pk" PRIMARY KEY("userId","videoId")
);
--> statement-breakpoint
CREATE TABLE "wishlist" (
	"userId" uuid NOT NULL,
	"courseId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_pk" PRIMARY KEY("userId","courseId")
);
--> statement-breakpoint
CREATE TABLE "discussion_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"threadId" uuid NOT NULL,
	"authorId" uuid NOT NULL,
	"body" text NOT NULL,
	"fromInstructor" boolean DEFAULT false NOT NULL,
	"upvoteCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discussion_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"authorId" uuid NOT NULL,
	"lessonId" uuid,
	"videoId" uuid,
	"title" varchar(255),
	"body" text NOT NULL,
	"isPinned" boolean DEFAULT false NOT NULL,
	"isResolved" boolean DEFAULT false NOT NULL,
	"upvoteCount" integer DEFAULT 0 NOT NULL,
	"replyCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone,
	CONSTRAINT "discussion_threads_single_parent_check" CHECK (("discussion_threads"."lessonId" is not null)::int + ("discussion_threads"."videoId" is not null)::int = 1)
);
--> statement-breakpoint
CREATE TABLE "discussion_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"target" "discussion_vote_target" NOT NULL,
	"threadId" uuid,
	"replyId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discussion_votes_single_target_check" CHECK (("discussion_votes"."threadId" is not null)::int + ("discussion_votes"."replyId" is not null)::int = 1)
);
--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"query" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_watch_history" (
	"userId" uuid NOT NULL,
	"videoId" uuid NOT NULL,
	"lastPositionSeconds" integer DEFAULT 0 NOT NULL,
	"watchedSeconds" integer DEFAULT 0 NOT NULL,
	"isCompleted" boolean DEFAULT false NOT NULL,
	"firstWatchedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_watch_history_pk" PRIMARY KEY("userId","videoId"),
	CONSTRAINT "video_watch_history_position_check" CHECK ("video_watch_history"."lastPositionSeconds" >= 0 and "video_watch_history"."watchedSeconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" varchar(500) NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"courseId" uuid NOT NULL,
	"courseTitle" varchar(255) NOT NULL,
	"credentialId" varchar(64) NOT NULL,
	"issuedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_activity" (
	"userId" uuid NOT NULL,
	"day" date NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_activity_pk" PRIMARY KEY("userId","day"),
	CONSTRAINT "learning_activity_minutes_check" CHECK ("learning_activity"."minutes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"userId" uuid NOT NULL,
	"achievementId" uuid NOT NULL,
	"earnedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_achievements_pk" PRIMARY KEY("userId","achievementId")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"link" jsonb,
	"readAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "creator_videos" ADD CONSTRAINT "creator_videos_channelId_channels_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_channelId_channels_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_reactions" ADD CONSTRAINT "video_reactions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_reactions" ADD CONSTRAINT "video_reactions_videoId_creator_videos_id_fk" FOREIGN KEY ("videoId") REFERENCES "public"."creator_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_threadId_discussion_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."discussion_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_threads" ADD CONSTRAINT "discussion_threads_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_threads" ADD CONSTRAINT "discussion_threads_lessonId_lessons_id_fk" FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_threads" ADD CONSTRAINT "discussion_threads_videoId_creator_videos_id_fk" FOREIGN KEY ("videoId") REFERENCES "public"."creator_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_votes" ADD CONSTRAINT "discussion_votes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_votes" ADD CONSTRAINT "discussion_votes_threadId_discussion_threads_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."discussion_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_votes" ADD CONSTRAINT "discussion_votes_replyId_discussion_replies_id_fk" FOREIGN KEY ("replyId") REFERENCES "public"."discussion_replies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_watch_history" ADD CONSTRAINT "video_watch_history_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_watch_history" ADD CONSTRAINT "video_watch_history_videoId_creator_videos_id_fk" FOREIGN KEY ("videoId") REFERENCES "public"."creator_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_activity" ADD CONSTRAINT "learning_activity_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_achievements_id_fk" FOREIGN KEY ("achievementId") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "creator_videos_channel_idx" ON "creator_videos" USING btree ("channelId","publishedAt") WHERE "creator_videos"."deletedAt" is null;--> statement-breakpoint
CREATE INDEX "creator_videos_published_idx" ON "creator_videos" USING btree ("publishedAt") WHERE ("creator_videos"."deletedAt" is null and "creator_videos"."status" = $1 and "creator_videos"."visibility" = $2);--> statement-breakpoint
CREATE INDEX "creator_videos_views_idx" ON "creator_videos" USING btree ("viewCount") WHERE ("creator_videos"."deletedAt" is null and "creator_videos"."status" = $1);--> statement-breakpoint
CREATE INDEX "creator_videos_pending_media_idx" ON "creator_videos" USING btree ("createdAt") WHERE "creator_videos"."deletedAt" is null and "creator_videos"."videoUrl" is not null;--> statement-breakpoint
CREATE INDEX "creator_videos_deleted_at_idx" ON "creator_videos" USING btree ("deletedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "course_reviews_user_course_unique_idx" ON "course_reviews" USING btree ("userId","courseId");--> statement-breakpoint
CREATE INDEX "course_reviews_course_idx" ON "course_reviews" USING btree ("courseId","createdAt");--> statement-breakpoint
CREATE INDEX "course_reviews_user_idx" ON "course_reviews" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "subscriptions_channel_idx" ON "subscriptions" USING btree ("channelId");--> statement-breakpoint
CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "video_reactions_video_idx" ON "video_reactions" USING btree ("videoId");--> statement-breakpoint
CREATE INDEX "video_reactions_user_idx" ON "video_reactions" USING btree ("userId","updatedAt");--> statement-breakpoint
CREATE INDEX "wishlist_user_idx" ON "wishlist" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "discussion_replies_thread_idx" ON "discussion_replies" USING btree ("threadId","createdAt") WHERE "discussion_replies"."deletedAt" is null;--> statement-breakpoint
CREATE INDEX "discussion_replies_deleted_at_idx" ON "discussion_replies" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "discussion_threads_lesson_idx" ON "discussion_threads" USING btree ("lessonId","isPinned","createdAt") WHERE "discussion_threads"."deletedAt" is null;--> statement-breakpoint
CREATE INDEX "discussion_threads_video_idx" ON "discussion_threads" USING btree ("videoId","createdAt") WHERE "discussion_threads"."deletedAt" is null;--> statement-breakpoint
CREATE INDEX "discussion_threads_author_idx" ON "discussion_threads" USING btree ("authorId","createdAt") WHERE "discussion_threads"."deletedAt" is null;--> statement-breakpoint
CREATE INDEX "discussion_threads_deleted_at_idx" ON "discussion_threads" USING btree ("deletedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "discussion_votes_user_thread_unique_idx" ON "discussion_votes" USING btree ("userId","threadId") WHERE "discussion_votes"."threadId" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "discussion_votes_user_reply_unique_idx" ON "discussion_votes" USING btree ("userId","replyId") WHERE "discussion_votes"."replyId" is not null;--> statement-breakpoint
CREATE INDEX "discussion_votes_thread_idx" ON "discussion_votes" USING btree ("threadId") WHERE "discussion_votes"."threadId" is not null;--> statement-breakpoint
CREATE INDEX "discussion_votes_reply_idx" ON "discussion_votes" USING btree ("replyId") WHERE "discussion_votes"."replyId" is not null;--> statement-breakpoint
CREATE INDEX "search_history_user_idx" ON "search_history" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "video_watch_history_recent_idx" ON "video_watch_history" USING btree ("userId","updatedAt");--> statement-breakpoint
CREATE INDEX "video_watch_history_video_idx" ON "video_watch_history" USING btree ("videoId");--> statement-breakpoint
CREATE UNIQUE INDEX "achievements_slug_unique_idx" ON "achievements" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_credential_unique_idx" ON "certificates" USING btree ("credentialId");--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_user_course_unique_idx" ON "certificates" USING btree ("userId","courseId");--> statement-breakpoint
CREATE INDEX "certificates_user_idx" ON "certificates" USING btree ("userId","issuedAt");--> statement-breakpoint
CREATE INDEX "learning_activity_user_day_idx" ON "learning_activity" USING btree ("userId","day") WHERE "learning_activity"."minutes" > 0;--> statement-breakpoint
CREATE INDEX "user_achievements_user_idx" ON "user_achievements" USING btree ("userId","earnedAt");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "notifications_unread_idx" ON "notifications" USING btree ("userId") WHERE "notifications"."readAt" is null;