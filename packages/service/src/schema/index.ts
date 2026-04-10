import { defineRelations } from "drizzle-orm";
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

export { currencies, currencyType } from "./currencies";
export { categories } from "./categories";
export { wallets } from "./wallets";
export {
  transactionTypeEnum,
  transactions,
  transactionEntries,
} from "./transactions";
export { calendars } from "./calendars";
export { eventStatusEnum, eventTransparencyEnum, events } from "./events";
export { eventExceptions } from "./event-exceptions";
export { alarmActionEnum, alarms } from "./alarms";
export { activityCategories } from "./activity-categories";
export { activityStatusEnum, activities } from "./activities";
export { goalFrequencyTypeEnum, activityGoals } from "./activity-goals";
export { activityLogs } from "./activity-logs";

export const relations = defineRelations(
  {
    currencies,
    categories,
    wallets,
    transactions,
    transactionEntries,
    calendars,
    events,
    eventExceptions,
    alarms,
    activityCategories,
    activities,
    activityGoals,
    activityLogs,
  },
  (r) => ({
    currencies: {
      transactionEntries: r.many.transactionEntries({
        alias: "currency",
      }),
      snapshotTransactionEntries: r.many.transactionEntries({
        alias: "snapshotCurrency",
      }),
    },
    categories: {
      transactions: r.many.transactions(),
    },
    wallets: {
      transactionEntries: r.many.transactionEntries(),
    },
    transactions: {
      category: r.one.categories({
        from: r.transactions.categoryId,
        to: r.categories.id,
      }),
      entries: r.many.transactionEntries(),
    },
    transactionEntries: {
      transaction: r.one.transactions({
        from: r.transactionEntries.transactionId,
        to: r.transactions.id,
        optional: false,
      }),
      wallet: r.one.wallets({
        from: r.transactionEntries.walletId,
        to: r.wallets.id,
        optional: false,
      }),
      currency: r.one.currencies({
        from: r.transactionEntries.currencyId,
        to: r.currencies.id,
        alias: "currency",
        optional: false,
      }),
      snapshotCurrency: r.one.currencies({
        from: r.transactionEntries.snapshotCurrencyId,
        to: r.currencies.id,
        alias: "snapshotCurrency",
        optional: false,
      }),
    },
    calendars: {
      events: r.many.events(),
    },
    events: {
      calendar: r.one.calendars({
        from: r.events.calendarId,
        to: r.calendars.id,
        optional: false,
      }),
      exceptions: r.many.eventExceptions(),
      alarms: r.many.alarms(),
    },
    eventExceptions: {
      event: r.one.events({
        from: r.eventExceptions.eventId,
        to: r.events.id,
        optional: false,
      }),
      alarms: r.many.alarms(),
    },
    alarms: {
      event: r.one.events({
        from: r.alarms.eventId,
        to: r.events.id,
      }),
      exception: r.one.eventExceptions({
        from: r.alarms.exceptionId,
        to: r.eventExceptions.id,
      }),
    },
    activityCategories: {
      activities: r.many.activities(),
    },
    activities: {
      category: r.one.activityCategories({
        from: r.activities.categoryId,
        to: r.activityCategories.id,
      }),
      goals: r.many.activityGoals(),
      logs: r.many.activityLogs(),
    },
    activityGoals: {
      activity: r.one.activities({
        from: r.activityGoals.activityId,
        to: r.activities.id,
        optional: false,
      }),
    },
    activityLogs: {
      activity: r.one.activities({
        from: r.activityLogs.activityId,
        to: r.activities.id,
        optional: false,
      }),
    },
  }),
);
