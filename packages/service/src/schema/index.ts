import { relations } from "drizzle-orm";
import { currencies } from "./currencies";
import { categories } from "./categories";
import { wallets } from "./wallets";
import { transactions, transactionEntries } from "./transactions";
import { calendars } from "./calendars";
import { events } from "./events";
import { eventExceptions } from "./event-exceptions";
import { alarms } from "./alarms";
import { activityCategories } from "./activity-categories";
import { activities } from "./activities";
import { activityGoals } from "./activity-goals";
import { activityLogs } from "./activity-logs";

export { currencies } from "./currencies";
export { categories } from "./categories";
export { wallets } from "./wallets";
export {
  transactionTypeEnum,
  transactions,
  transactionEntries,
} from "./transactions";
export { calendars } from "./calendars";
export {
  eventStatusEnum,
  eventTransparencyEnum,
  events,
} from "./events";
export { eventExceptions } from "./event-exceptions";
export { alarmActionEnum, alarms } from "./alarms";
export { activityCategories } from "./activity-categories";
export { activityStatusEnum, activities } from "./activities";
export { goalFrequencyTypeEnum, activityGoals } from "./activity-goals";
export { activityLogs } from "./activity-logs";

// Relations — Finance

export const currenciesRelations = relations(currencies, ({ many }) => ({
  transactionEntries: many(transactionEntries),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const walletsRelations = relations(wallets, ({ many }) => ({
  transactionEntries: many(transactionEntries),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  entries: many(transactionEntries),
}));

export const transactionEntriesRelations = relations(
  transactionEntries,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionEntries.transactionId],
      references: [transactions.id],
    }),
    wallet: one(wallets, {
      fields: [transactionEntries.walletId],
      references: [wallets.id],
    }),
    currency: one(currencies, {
      fields: [transactionEntries.currencyId],
      references: [currencies.id],
    }),
  }),
);

// Relations — Calendar

export const calendarsRelations = relations(calendars, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  calendar: one(calendars, {
    fields: [events.calendarId],
    references: [calendars.id],
  }),
  exceptions: many(eventExceptions),
  alarms: many(alarms),
}));

export const eventExceptionsRelations = relations(
  eventExceptions,
  ({ one, many }) => ({
    event: one(events, {
      fields: [eventExceptions.eventId],
      references: [events.id],
    }),
    alarms: many(alarms),
  }),
);

export const alarmsRelations = relations(alarms, ({ one }) => ({
  event: one(events, {
    fields: [alarms.eventId],
    references: [events.id],
  }),
  exception: one(eventExceptions, {
    fields: [alarms.exceptionId],
    references: [eventExceptions.id],
  }),
}));

// Relations — Activities

export const activityCategoriesRelations = relations(
  activityCategories,
  ({ many }) => ({
    activities: many(activities),
  }),
);

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  category: one(activityCategories, {
    fields: [activities.categoryId],
    references: [activityCategories.id],
  }),
  goals: many(activityGoals),
  logs: many(activityLogs),
}));

export const activityGoalsRelations = relations(activityGoals, ({ one }) => ({
  activity: one(activities, {
    fields: [activityGoals.activityId],
    references: [activities.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  activity: one(activities, {
    fields: [activityLogs.activityId],
    references: [activities.id],
  }),
}));
