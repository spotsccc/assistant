import {
  index,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { currencies } from "./currencies";
/*
 *   - `id` UUID PK
- `base_currency_id` FK -> `currencies.id`
- `quote_currency_id` FK -> `currencies.id`
- `rate` NUMERIC(36, 18)
- `effective_at` TIMESTAMP
- `granularity` enum: `live | daily`
- `source` VARCHAR
- `created_at` TIMESTAMP
- unique constraint на `base_currency_id`, `quote_currency_id`, `effective_at`, `granularity`

 */

export const granularity = pgEnum("granularity", ["daily", "live"]);

export const exchangeRates = pgTable(
  "exchange_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    baseCurrencyId: uuid("base_currency_id").references(() => currencies.id),
    quouteCurrencyId: uuid("quoute_currency_id").references(
      () => currencies.id,
    ),
    rate: numeric("rate", { precision: 36, scale: 18 }),
    effectiveAt: timestamp("effective_at"),
    granularity: granularity("granularity"),
    source: varchar("source"),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    unique().on(
      table.baseCurrencyId,
      table.quouteCurrencyId,
      table.effectiveAt,
      table.granularity,
    ),
  ],
);
