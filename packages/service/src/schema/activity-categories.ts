import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

export const activityCategories = pgTable("activity_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityCategory = InferSelectModel<typeof activityCategories>;
