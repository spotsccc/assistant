import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { events, eventStatusEnum, eventTransparencyEnum } from "./events";

export const eventExceptions = pgTable(
  "event_exceptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .references(() => events.id, { onDelete: "cascade" })
      .notNull(),
    recurrenceId: timestamp("recurrence_id", { withTimezone: true }),
    recurrenceIdDate: date("recurrence_id_date", { mode: "string" }),
    isCancelled: boolean("is_cancelled").default(false).notNull(),
    summary: varchar("summary", { length: 500 }),
    description: text("description"),
    location: varchar("location", { length: 500 }),
    isAllDay: boolean("is_all_day"),
    dtstart: timestamp("dtstart", { withTimezone: true }),
    dtend: timestamp("dtend", { withTimezone: true }),
    dtstartDate: date("dtstart_date", { mode: "string" }),
    dtendDate: date("dtend_date", { mode: "string" }),
    timezone: varchar("timezone", { length: 50 }),
    status: eventStatusEnum("status"),
    transparency: eventTransparencyEnum("transparency"),
    sequence: integer("sequence").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("event_exceptions_event_id_idx").on(table.eventId),
    index("event_exceptions_recurrence_id_idx").on(table.recurrenceId),
  ],
);

export type EventException = InferSelectModel<typeof eventExceptions>;
