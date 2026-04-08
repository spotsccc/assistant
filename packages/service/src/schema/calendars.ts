import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

export const calendars = pgTable("calendars", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  description: varchar("description", { length: 500 }),
  isVisible: boolean("is_visible").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  timezone: varchar("timezone", { length: 50 }).notNull(),
  ctag: varchar("ctag", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Calendar = InferSelectModel<typeof calendars>;
