import {
  pgTable,
  uuid,
  varchar,
  numeric,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { wallets } from "./wallets";
import { currencies } from "./currencies";
import { InferSelectModel } from "drizzle-orm";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
  "transfer",
]);

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  description: varchar("description", { length: 500 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Transaction = InferSelectModel<typeof transactions>;

export const transactionEntries = pgTable("transaction_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: uuid("transaction_id")
    .references(() => transactions.id, { onDelete: "cascade" })
    .notNull(),
  walletId: uuid("wallet_id")
    .references(() => wallets.id)
    .notNull(),
  currencyId: uuid("currency_id")
    .references(() => currencies.id)
    .notNull(),
  amount: numeric("amount", { precision: 36, scale: 18 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  snapshotCurrencyId: uuid("snapshot_currency_id")
    .references(() => currencies.id)
    .notNull(),
  snapshotAmount: numeric("snapshot_amount", {
    precision: 36,
    scale: 18,
  }).notNull(),
  snapshotRate: numeric("snapshotRate", { precision: 36, scale: 18 }).notNull(),
});

export type TransactionEntry = InferSelectModel<typeof transactionEntries>;
