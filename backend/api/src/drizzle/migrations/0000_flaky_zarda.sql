CREATE TYPE "public"."user_role" AS ENUM('student', 'instructor', 'admin', 'superadmin');--> statement-breakpoint
CREATE TYPE "public"."user_role_grant" AS ENUM('instructor', 'moderator', 'content_reviewer', 'support_agent', 'finance_operator');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('pending', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."course_level" AS ENUM('beginner', 'intermediate', 'advanced', 'all_levels');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('draft', 'in_review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."course_visibility" AS ENUM('public', 'unlisted', 'private');--> statement-breakpoint
CREATE TYPE "public"."lesson_type" AS ENUM('video', 'article', 'quiz', 'download');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'completed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TABLE "user_role_grants" (
	"userId" uuid NOT NULL,
	"grant" "user_role_grant" NOT NULL,
	"grantedBy" uuid,
	"grantedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone,
	CONSTRAINT "user_role_grants_pk" PRIMARY KEY("userId","grant")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firstName" varchar(255) NOT NULL,
	"lastName" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"age" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"passwordHash" varchar(255) NOT NULL,
	"avatarUrl" varchar(2048),
	"bio" varchar(500),
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"status" "user_status" DEFAULT 'pending' NOT NULL,
	"isEmailVerified" boolean DEFAULT false NOT NULL,
	"emailVerifiedAt" timestamp with time zone,
	"lastLoginAt" timestamp with time zone,
	"passwordChangedAt" timestamp with time zone,
	"failedLoginAttempts" integer DEFAULT 0 NOT NULL,
	"lockedUntil" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ownerId" uuid NOT NULL,
	"handle" varchar(100) NOT NULL,
	"displayName" varchar(255) NOT NULL,
	"description" varchar(2000),
	"avatarUrl" varchar(2048),
	"bannerUrl" varchar(2048),
	"isVerified" boolean DEFAULT false NOT NULL,
	"subscriberCount" integer DEFAULT 0 NOT NULL,
	"publishedCourseCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channelId" uuid NOT NULL,
	"authorId" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"subtitle" varchar(500),
	"description" text NOT NULL,
	"thumbnailUrl" varchar(2048),
	"trailerUrl" varchar(2048),
	"level" "course_level" DEFAULT 'all_levels' NOT NULL,
	"priceInPaise" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"status" "course_status" DEFAULT 'draft' NOT NULL,
	"visibility" "course_visibility" DEFAULT 'private' NOT NULL,
	"ratingAverage" numeric(3, 2) DEFAULT '0' NOT NULL,
	"ratingCount" integer DEFAULT 0 NOT NULL,
	"studentCount" integer DEFAULT 0 NOT NULL,
	"durationSeconds" integer DEFAULT 0 NOT NULL,
	"lessonCount" integer DEFAULT 0 NOT NULL,
	"publishedAt" timestamp with time zone,
	"archivedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"courseId" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" "lesson_type" DEFAULT 'video' NOT NULL,
	"position" integer NOT NULL,
	"durationSeconds" integer DEFAULT 0 NOT NULL,
	"isPreview" boolean DEFAULT false NOT NULL,
	"videoUrl" varchar(2048),
	"contentMarkdown" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"deletedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"userId" uuid NOT NULL,
	"courseId" uuid NOT NULL,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"amountPaidInPaise" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"progressPercent" integer DEFAULT 0 NOT NULL,
	"completedLessons" integer DEFAULT 0 NOT NULL,
	"enrolledAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastAccessedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_pk" PRIMARY KEY("userId","courseId"),
	CONSTRAINT "enrollments_progress_percent_check" CHECK ("enrollments"."progressPercent" between 0 and 100),
	CONSTRAINT "enrollments_completed_lessons_check" CHECK ("enrollments"."completedLessons" >= 0)
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"userId" uuid NOT NULL,
	"lessonId" uuid NOT NULL,
	"lastPositionSeconds" integer DEFAULT 0 NOT NULL,
	"watchedSeconds" integer DEFAULT 0 NOT NULL,
	"isCompleted" boolean DEFAULT false NOT NULL,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_pk" PRIMARY KEY("userId","lessonId"),
	CONSTRAINT "lesson_progress_position_check" CHECK ("lesson_progress"."lastPositionSeconds" >= 0 and "lesson_progress"."watchedSeconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"courseId" uuid NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"amountInPaise" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"discountInPaise" integer DEFAULT 0 NOT NULL,
	"taxInPaise" integer DEFAULT 0 NOT NULL,
	"provider" varchar(50),
	"providerRef" varchar(255),
	"failureReason" varchar(500),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"paidAt" timestamp with time zone,
	"refundedAt" timestamp with time zone,
	CONSTRAINT "orders_amount_check" CHECK ("orders"."amountInPaise" >= 0),
	CONSTRAINT "orders_discount_check" CHECK ("orders"."discountInPaise" >= 0 and "orders"."discountInPaise" <= "orders"."amountInPaise"),
	CONSTRAINT "orders_tax_check" CHECK ("orders"."taxInPaise" >= 0)
);
--> statement-breakpoint
ALTER TABLE "user_role_grants" ADD CONSTRAINT "user_role_grants_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_grants" ADD CONSTRAINT "user_role_grants_grantedBy_users_id_fk" FOREIGN KEY ("grantedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_channelId_channels_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_lessons_id_fk" FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_role_grants_user_idx" ON "user_role_grants" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_role_grants_grant_idx" ON "user_role_grants" USING btree ("grant");--> statement-breakpoint
CREATE INDEX "user_role_grants_expires_at_idx" ON "user_role_grants" USING btree ("expiresAt") WHERE "user_role_grants"."expiresAt" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique_idx" ON "users" USING btree ("email") WHERE "users"."deletedAt" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique_idx" ON "users" USING btree ("username") WHERE "users"."deletedAt" is null;--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deletedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "channels_handle_unique_idx" ON "channels" USING btree ("handle") WHERE "channels"."deletedAt" is null;--> statement-breakpoint
CREATE INDEX "channels_owner_idx" ON "channels" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "channels_deleted_at_idx" ON "channels" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "channels_trending_idx" ON "channels" USING btree ("isVerified","subscriberCount") WHERE "channels"."deletedAt" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "courses_slug_unique_idx" ON "courses" USING btree ("slug") WHERE "courses"."deletedAt" is null;--> statement-breakpoint
CREATE INDEX "courses_channel_idx" ON "courses" USING btree ("channelId") WHERE "courses"."deletedAt" is null;--> statement-breakpoint
CREATE INDEX "courses_author_idx" ON "courses" USING btree ("authorId") WHERE "courses"."deletedAt" is null;--> statement-breakpoint
CREATE INDEX "courses_published_idx" ON "courses" USING btree ("publishedAt") WHERE ("courses"."deletedAt" is null and "courses"."status" = $1 and "courses"."visibility" = $2);--> statement-breakpoint
CREATE INDEX "courses_price_idx" ON "courses" USING btree ("priceInPaise") WHERE ("courses"."deletedAt" is null and "courses"."status" = $1 and "courses"."visibility" = $2);--> statement-breakpoint
CREATE INDEX "courses_rating_idx" ON "courses" USING btree ("ratingAverage") WHERE ("courses"."deletedAt" is null and "courses"."status" = $1);--> statement-breakpoint
CREATE INDEX "courses_student_count_idx" ON "courses" USING btree ("studentCount") WHERE ("courses"."deletedAt" is null and "courses"."status" = $1);--> statement-breakpoint
CREATE INDEX "courses_deleted_at_idx" ON "courses" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "lessons_course_position_idx" ON "lessons" USING btree ("courseId","position") WHERE "lessons"."deletedAt" is null;--> statement-breakpoint
CREATE INDEX "lessons_preview_idx" ON "lessons" USING btree ("courseId") WHERE "lessons"."deletedAt" is null and "lessons"."isPreview" = true;--> statement-breakpoint
CREATE INDEX "lessons_deleted_at_idx" ON "lessons" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "enrollments_recent_idx" ON "enrollments" USING btree ("userId","lastAccessedAt") WHERE "enrollments"."status" = 'active';--> statement-breakpoint
CREATE INDEX "enrollments_course_idx" ON "enrollments" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX "enrollments_completed_at_idx" ON "enrollments" USING btree ("completedAt") WHERE "enrollments"."status" = 'completed';--> statement-breakpoint
CREATE INDEX "lesson_progress_recent_idx" ON "lesson_progress" USING btree ("userId","updatedAt") WHERE "lesson_progress"."isCompleted" = false;--> statement-breakpoint
CREATE INDEX "lesson_progress_lesson_idx" ON "lesson_progress" USING btree ("lessonId");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_provider_ref_unique_idx" ON "orders" USING btree ("provider","providerRef") WHERE "orders"."providerRef" is not null;--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "orders_course_idx" ON "orders" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX "orders_pending_idx" ON "orders" USING btree ("createdAt") WHERE "orders"."status" = 'pending';