import {
  pgTable,
  uuid,
  date,
  timestamp,
  integer,
  numeric,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { activities } from "./activities";

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    activityId: uuid("activity_id")
      .references(() => activities.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date", { mode: "string" }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    duration: integer("duration"),
    value: numeric("value", { precision: 12, scale: 4 }),
    note: varchar("note", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("activity_logs_activity_id_idx").on(table.activityId),
    index("activity_logs_date_idx").on(table.date),
    index("activity_logs_activity_date_idx").on(table.activityId, table.date),
  ],
);

export type ActivityLog = InferSelectModel<typeof activityLogs>;
