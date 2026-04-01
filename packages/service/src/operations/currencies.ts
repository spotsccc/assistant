import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "../index";
import { currencies } from "../schema/index";
import { NotFoundError } from "./errors";

export const createCurrencySchema = z.object({
  code: z.string().describe("Currency code (e.g. USD, EUR)"),
  name: z.string().describe("Currency name"),
  symbol: z.string().optional().describe("Currency symbol (e.g. $, €)"),
});

export const deleteCurrencySchema = z.object({
  id: z.string().uuid().describe("Currency ID"),
});

export async function getCurrencies() {
  return db.query.currencies.findMany({
    orderBy: (currencies, { asc }) => [asc(currencies.code)],
  });
}

export async function createCurrency(input: {
  code: string;
  name: string;
  symbol?: string;
}) {
  const [currency] = await db
    .insert(currencies)
    .values({ code: input.code, name: input.name, symbol: input.symbol })
    .returning();

  return currency!;
}

export async function deleteCurrency(id: string) {
  const currency = await db.query.currencies.findFirst({
    where: eq(currencies.id, id),
  });

  if (!currency) {
    return new NotFoundError({ entity: "Currency", id });
  }

  await db.delete(currencies).where(eq(currencies.id, id));

  return { deleted: true };
}
