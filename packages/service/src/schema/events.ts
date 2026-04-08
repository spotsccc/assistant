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
  pgEnum,
} from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { calendars } from "./calendars";

export const eventStatusEnum = pgEnum("event_status", [
  "tentative",
  "confirmed",
  "cancelled",
]);

export const eventTransparencyEnum = pgEnum("event_transparency", [
  "opaque",
  "transparent",
]);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    calendarId: uuid("calendar_id")
      .references(() => calendars.id, { onDelete: "cascade" })
      .notNull(),
    uid: varchar("uid", { length: 255 }).unique().notNull(),
    uri: varchar("uri", { length: 500 }),
    etag: varchar("etag", { length: 64 }).notNull(),
    sequence: integer("sequence").default(0).notNull(),
    status: eventStatusEnum("status").default("confirmed").notNull(),
    summary: varchar("summary", { length: 500 }).notNull(),
    description: text("description"),
    location: varchar("location", { length: 500 }),
    isAllDay: boolean("is_all_day").default(false).notNull(),
    dtstart: timestamp("dtstart", { withTimezone: true }),
    dtend: timestamp("dtend", { withTimezone: true }),
    dtstartDate: date("dtstart_date", { mode: "string" }),
    dtendDate: date("dtend_date", { mode: "string" }),
    timezone: varchar("timezone", { length: 50 }),
    transparency: eventTransparencyEnum("transparency")
      .default("opaque")
      .notNull(),
    rrule: text("rrule"),
    rdate: text("rdate"),
    exdate: text("exdate"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("events_calendar_id_idx").on(table.calendarId),
    index("events_dtstart_dtend_idx").on(table.dtstart, table.dtend),
    index("events_dtstart_date_dtend_date_idx").on(
      table.dtstartDate,
      table.dtendDate,
    ),
  ],
);

export type Event = InferSelectModel<typeof events>;
