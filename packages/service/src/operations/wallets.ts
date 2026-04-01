import { eq, sql } from "drizzle-orm";
import z from "zod";
import { db } from "../index";
import { wallets, currencies, transactionEntries } from "../schema/index";
import { NotFoundError } from "./errors";

export const createWalletSchema = z.object({
  name: z.string().describe("Wallet name"),
});

export const deleteWalletSchema = z.object({
  id: z.string().uuid().describe("Wallet ID"),
});

export const getWalletBalanceSchema = z.object({
  walletId: z.string().uuid().describe("Wallet ID"),
});

export type CreateWalletInput = z.infer<typeof createWalletSchema>;

export async function getWallets() {
  const allWallets = await db.query.wallets.findMany();

  const balances = await db
    .select({
      walletId: transactionEntries.walletId,
      currencyCode: currencies.code,
      currencySymbol: currencies.symbol,
      balance: sql<string>`coalesce(sum(${transactionEntries.amount}), 0)`,
    })
    .from(transactionEntries)
    .innerJoin(currencies, eq(transactionEntries.currencyId, currencies.id))
    .groupBy(transactionEntries.walletId, currencies.code, currencies.symbol);

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
    where: eq(wallets.id, walletId),
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
    where: eq(wallets.id, id),
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
