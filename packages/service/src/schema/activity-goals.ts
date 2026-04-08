import {
  pgTable,
  uuid,
  integer,
  date,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { activities } from "./activities";

export const goalFrequencyTypeEnum = pgEnum("goal_frequency_type", [
  "daily",
  "weekly",
  "monthly",
]);

export const activityGoals = pgTable(
  "activity_goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    activityId: uuid("activity_id")
      .references(() => activities.id, { onDelete: "cascade" })
      .notNull(),
    frequencyType: goalFrequencyTypeEnum("frequency_type").notNull(),
    frequencyValue: integer("frequency_value").default(1).notNull(),
    effectiveFrom: date("effective_from", { mode: "string" }).notNull(),
    effectiveUntil: date("effective_until", { mode: "string" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("activity_goals_activity_id_idx").on(table.activityId),
    index("activity_goals_effective_range_idx").on(
      table.activityId,
      table.effectiveFrom,
      table.effectiveUntil,
    ),
  ],
);

export type ActivityGoal = InferSelectModel<typeof activityGoals>;
