import { and, eq, sql, type SQL } from "drizzle-orm";
import z from "zod";
import { db } from "../index";
import { wallets, currencies, transactionEntries } from "../schema/index";
import { NotFoundError } from "./errors";

export const createWalletSchema = z.object({
  name: z.string().describe("Wallet name"),
});

export const getWalletsSchema = z.object({
  balanceCurrencyCode: z
    .string()
    .optional()
    .describe("Aggregate balances in this currency"),
});

export const deleteWalletSchema = z.object({
  id: z.string().uuid().describe("Wallet ID"),
});

export const getWalletBalanceSchema = z.object({
  walletId: z.string().uuid().describe("Wallet ID"),
});

export type CreateWalletInput = z.infer<typeof createWalletSchema>;

export async function getWallets(
  input: z.infer<typeof getWalletsSchema> = {},
) {
  const amountColumn = input.balanceCurrencyCode
    ? transactionEntries.snapshotAmount
    : transactionEntries.amount;
  const currencyIdColumn = input.balanceCurrencyCode
    ? transactionEntries.snapshotCurrencyId
    : transactionEntries.currencyId;
  const allWallets = await db.query.wallets.findMany();
  const conditions: SQL[] = [];

  if (input.balanceCurrencyCode) {
    conditions.push(eq(currencies.code, input.balanceCurrencyCode));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const balancesQuery = db
    .select({
      walletId: transactionEntries.walletId,
      currencyCode: currencies.code,
      currencySymbol: currencies.symbol,
      balance: sql<string>`coalesce(sum(${amountColumn}), 0)`,
    })
    .from(transactionEntries)
    .innerJoin(currencies, eq(currencyIdColumn, currencies.id));

  const balances = where
    ? await balancesQuery
        .where(where)
        .groupBy(transactionEntries.walletId, currencies.code, currencies.symbol)
    : await balancesQuery.groupBy(
        transactionEntries.walletId,
        currencies.code,
        currencies.symbol,
      );

  return allWallets.map((wallet) => ({
    ...wallet,
    balances: balances
      .filter((b) => b.walletId === wallet.id)
      .map((b) => ({
        currencyCode: b.currencyCode,
        currencySymbol: b.currencySymbol,
        balance: b.balance,
      })),
  }));
}

export async function getWalletBalance(walletId: string) {
  const wallet = await db.query.wallets.findFirst({
    where: {
      id: walletId,
    },
  });

  if (!wallet) {
    return new NotFoundError({ entity: "Wallet", id: walletId });
  }

  const balances = await db
    .select({
      currencyCode: currencies.code,
      currencySymbol: currencies.symbol,
      balance: sql<string>`coalesce(sum(${transactionEntries.amount}), 0)`,
    })
    .from(transactionEntries)
    .innerJoin(currencies, eq(transactionEntries.currencyId, currencies.id))
    .where(eq(transactionEntries.walletId, walletId))
    .groupBy(currencies.code, currencies.symbol);

  return {
    id: wallet.id,
    name: wallet.name,
    balances,
  };
}

export async function deleteWallet(id: string) {
  const wallet = await db.query.wallets.findFirst({
    where: {
      id,
    },
  });

  if (!wallet) {
    return new NotFoundError({ entity: "Wallet", id });
  }

  await db.delete(wallets).where(eq(wallets.id, id));

  return { deleted: true };
}

export async function createWallet(input: CreateWalletInput) {
  const [wallet] = await db
    .insert(wallets)
    .values({
      name: input.name,
    })
    .returning();

  return wallet!;
}
