import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { activityCategories } from "./activity-categories";

export const activityStatusEnum = pgEnum("activity_status", [
  "active",
  "paused",
  "archived",
]);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id").references(() => activityCategories.id),
    name: varchar("name", { length: 200 }).notNull(),
    description: varchar("description", { length: 500 }),
    color: varchar("color", { length: 20 }).notNull(),
    icon: varchar("icon", { length: 50 }),
    unit: varchar("unit", { length: 50 }),
    status: activityStatusEnum("status").default("active").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("activities_category_id_idx").on(table.categoryId),
    index("activities_status_idx").on(table.status),
  ],
);

export type Activity = InferSelectModel<typeof activities>;
