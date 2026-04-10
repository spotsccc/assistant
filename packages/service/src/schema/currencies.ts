import { pgTable, uuid, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const currencyType = pgEnum("currency_type", ["fiat", "crypto"]);

export const currencies = pgTable("currencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 10 }).unique().notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  symbol: varchar("symbol", { length: 5 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  type: currencyType("type").notNull(),
});
