import { relations } from "drizzle-orm";
import { currencies } from "./currencies";
import { categories } from "./categories";
import { wallets } from "./wallets";
import { transactions, transactionEntries } from "./transactions";

export { currencies } from "./currencies";
export { categories } from "./categories";
export { wallets } from "./wallets";
export {
  transactionTypeEnum,
  transactions,
  transactionEntries,
} from "./transactions";

// Relations

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
