CREATE TYPE "public"."activity_status" AS ENUM('active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."alarm_action" AS ENUM('display', 'email', 'audio');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('tentative', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."event_transparency" AS ENUM('opaque', 'transparent');--> statement-breakpoint
CREATE TYPE "public"."goal_frequency_type" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"name" varchar(200) NOT NULL,
	"description" varchar(500),
	"color" varchar(20) NOT NULL,
	"icon" varchar(50),
	"unit" varchar(50),
	"status" "activity_status" DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(20) NOT NULL,
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "activity_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "activity_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"frequency_type" "goal_frequency_type" NOT NULL,
	"frequency_value" integer DEFAULT 1 NOT NULL,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"date" date NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"duration" integer,
	"value" numeric(12, 4),
	"note" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alarms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"exception_id" uuid,
	"action" "alarm_action" DEFAULT 'display' NOT NULL,
	"trigger_relative" varchar(50),
	"trigger_absolute" timestamp with time zone,
	"description" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(20) NOT NULL,
	"description" varchar(500),
	"is_visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"timezone" varchar(50) NOT NULL,
	"ctag" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"recurrence_id" timestamp with time zone,
	"recurrence_id_date" date,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"summary" varchar(500),
	"description" text,
	"location" varchar(500),
	"is_all_day" boolean,
	"dtstart" timestamp with time zone,
	"dtend" timestamp with time zone,
	"dtstart_date" date,
	"dtend_date" date,
	"timezone" varchar(50),
	"status" "event_status",
	"transparency" "event_transparency",
	"sequence" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_id" uuid NOT NULL,
	"uid" varchar(255) NOT NULL,
	"uri" varchar(500),
	"etag" varchar(64) NOT NULL,
	"sequence" integer DEFAULT 0 NOT NULL,
	"status" "event_status" DEFAULT 'confirmed' NOT NULL,
	"summary" varchar(500) NOT NULL,
	"description" text,
	"location" varchar(500),
	"is_all_day" boolean DEFAULT false NOT NULL,
	"dtstart" timestamp with time zone,
	"dtend" timestamp with time zone,
	"dtstart_date" date,
	"dtend_date" date,
	"timezone" varchar(50),
	"transparency" "event_transparency" DEFAULT 'opaque' NOT NULL,
	"rrule" text,
	"rdate" text,
	"exdate" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "events_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "transaction_entries" ADD COLUMN "snapshot_currency_id" uuid;--> statement-breakpoint
ALTER TABLE "transaction_entries" ADD COLUMN "snapshot_amount" numeric(36, 18);--> statement-breakpoint
ALTER TABLE "transaction_entries" ADD COLUMN "snapshotRate" numeric(36, 18);--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_category_id_activity_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."activity_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_goals" ADD CONSTRAINT "activity_goals_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alarms" ADD CONSTRAINT "alarms_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alarms" ADD CONSTRAINT "alarms_exception_id_event_exceptions_id_fk" FOREIGN KEY ("exception_id") REFERENCES "public"."event_exceptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_exceptions" ADD CONSTRAINT "event_exceptions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_calendar_id_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_category_id_idx" ON "activities" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "activities_status_idx" ON "activities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "activity_goals_activity_id_idx" ON "activity_goals" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_goals_effective_range_idx" ON "activity_goals" USING btree ("activity_id","effective_from","effective_until");--> statement-breakpoint
CREATE INDEX "activity_logs_activity_id_idx" ON "activity_logs" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_logs_date_idx" ON "activity_logs" USING btree ("date");--> statement-breakpoint
CREATE INDEX "activity_logs_activity_date_idx" ON "activity_logs" USING btree ("activity_id","date");--> statement-breakpoint
CREATE INDEX "alarms_event_id_idx" ON "alarms" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "alarms_exception_id_idx" ON "alarms" USING btree ("exception_id");--> statement-breakpoint
CREATE INDEX "event_exceptions_event_id_idx" ON "event_exceptions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_exceptions_recurrence_id_idx" ON "event_exceptions" USING btree ("recurrence_id");--> statement-breakpoint
CREATE INDEX "events_calendar_id_idx" ON "events" USING btree ("calendar_id");--> statement-breakpoint
CREATE INDEX "events_dtstart_dtend_idx" ON "events" USING btree ("dtstart","dtend");--> statement-breakpoint
CREATE INDEX "events_dtstart_date_dtend_date_idx" ON "events" USING btree ("dtstart_date","dtend_date");--> statement-breakpoint
ALTER TABLE "transaction_entries" ADD CONSTRAINT "transaction_entries_snapshot_currency_id_currencies_id_fk" FOREIGN KEY ("snapshot_currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;