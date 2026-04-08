import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { events } from "./events";
import { eventExceptions } from "./event-exceptions";

export const alarmActionEnum = pgEnum("alarm_action", [
  "display",
  "email",
  "audio",
]);

export const alarms = pgTable(
  "alarms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id").references(() => events.id, {
      onDelete: "cascade",
    }),
    exceptionId: uuid("exception_id").references(() => eventExceptions.id, {
      onDelete: "cascade",
    }),
    action: alarmActionEnum("action").default("display").notNull(),
    triggerRelative: varchar("trigger_relative", { length: 50 }),
    triggerAbsolute: timestamp("trigger_absolute", { withTimezone: true }),
    description: varchar("description", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("alarms_event_id_idx").on(table.eventId),
    index("alarms_exception_id_idx").on(table.exceptionId),
  ],
);

export type Alarm = InferSelectModel<typeof alarms>;
