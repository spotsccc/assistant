import { eq, and, gte, lte, desc, sql, type SQL } from "drizzle-orm";
import { db } from "../index";
import {
  transactions,
  transactionEntries,
  wallets,
  currencies,
} from "../schema/index";
import z from "zod";
import { NotFoundError, InsufficientFundsError, DbError } from "./errors";

const numericString = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "Must be a numeric string")
  .refine((v) => parseFloat(v) > 0, "Must be positive");

const baseFields = {
  description: z.string().optional().describe("What the transaction is for"),
  amount: numericString.describe(
    "Transaction amount (always positive, e.g. '150.50')",
  ),
  walletId: z.string().uuid().describe("Source wallet ID"),
  currencyCode: z.string().describe("Currency code (e.g. ARS, RUB, USDT)"),
};

export const incomeSchema = z.object({
  ...baseFields,
  type: z.literal("income"),
});

export const expenseSchema = z.object({
  ...baseFields,
  categoryId: z
    .string()
    .uuid()
    .describe("Category ID (required for expenses)"),
  type: z.literal("expense"),
});

export const transferSchema = z.object({
  ...baseFields,
  type: z.literal("transfer"),
  toWalletId: z
    .string()
    .uuid()
    .describe("Target wallet ID (required for transfers)"),
  toCurrencyCode: z
    .string()
    .describe("Target currency code (for cross-currency transfers)"),
  toAmount: numericString.describe(
    "Target amount (for cross-currency transfers)",
  ),
});

export const createTransactionSchema = z.discriminatedUnion("type", [
  incomeSchema,
  expenseSchema,
  transferSchema,
]);

export const listTransactionsSchema = z.object({
  walletId: z.string().uuid().optional().describe("Filter by wallet ID"),
  categoryId: z.string().uuid().optional().describe("Filter by category ID"),
  type: z
    .enum(["income", "expense", "transfer"])
    .optional()
    .describe("Filter by transaction type"),
  limit: z.number().optional().describe("Number of results (default 50)"),
  offset: z.number().optional().describe("Offset for pagination"),
  dateFrom: z.coerce.date().optional().describe("Start date (ISO string)"),
  dateTo: z.coerce.date().optional().describe("End date (ISO string)"),
});

export const deleteTransactionSchema = z.object({
  id: z.string().uuid().describe("Transaction ID"),
});

type IncomeInput = z.infer<typeof incomeSchema>;
type ExpenseInput = z.infer<typeof expenseSchema>;
type TransferInput = z.infer<typeof transferSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>;

function createSnapshotEntry({
  currencyId,
  amount,
}: {
  currencyId: string;
  amount: string;
}) {
  return {
    currencyId,
    amount,
    snapshotCurrencyId: currencyId,
    snapshotAmount: amount,
    snapshot_Rate: "1",
  };
}

async function createIncome({
  walletId,
  currencyCode,
  description,
  type,
  amount,
}: IncomeInput) {
  const wallet = await db.query.wallets.findFirst({
    where: {
      id: walletId,
    },
  });
  if (!wallet) {
    return new NotFoundError({ entity: "Wallet", id: walletId });
  }

  const currency = await db.query.currencies.findFirst({
    where: {
      code: currencyCode,
    },
  });
  if (!currency) {
    return new NotFoundError({ entity: "Currency", id: currencyCode });
  }

  return await db
    .transaction(async (tx) => {
      const [txn] = await tx
        .insert(transactions)
        .values({
          description: description ?? "",
          type,
        })
        .returning();

      const [entry] = await tx
        .insert(transactionEntries)
        .values({
          transactionId: txn!.id,
          walletId,
          ...createSnapshotEntry({
            currencyId: currency.id,
            amount,
          }),
        })
        .returning();

      return { transaction: txn!, entries: [entry!] };
    })
    .catch((e) => new DbError({ reason: e.message, cause: e }));
}

async function createExpense({
  walletId,
  currencyCode,
  description,
  type,
  amount,
  categoryId,
}: ExpenseInput) {
  const wallet = await db.query.wallets.findFirst({
    where: {
      id: walletId,
    },
  });
  if (!wallet) {
    return new NotFoundError({ entity: "Wallet", id: walletId });
  }

  const currency = await db.query.currencies.findFirst({
    where: {
      code: currencyCode,
    },
  });
  if (!currency) {
    return new NotFoundError({ entity: "Currency", id: currencyCode });
  }

  return await db
    .transaction(async (tx) => {
      const { balance } = (
        await tx
          .select({
            balance: sql<string>`coalesce(sum(${transactionEntries.amount}), 0)`,
          })
          .from(transactionEntries)
          .where(
            and(
              eq(transactionEntries.walletId, walletId),
              eq(transactionEntries.currencyId, currency.id),
            ),
          )
      )[0]!;

      if (parseFloat(balance) < parseFloat(amount)) {
        return new InsufficientFundsError({
          walletId,
          available: balance,
          required: amount,
        });
      }

      const [txn] = await tx
        .insert(transactions)
        .values({
          description: description ?? "",
          type,
          categoryId,
        })
        .returning();

      const [entry] = await tx
        .insert(transactionEntries)
        .values({
          transactionId: txn!.id,
          walletId,
          ...createSnapshotEntry({
            currencyId: currency.id,
            amount: `-${amount}`,
          }),
        })
        .returning();

      return { transaction: txn!, entries: [entry!] };
    })
    .catch((e) => new DbError({ reason: e.message, cause: e }));
}

async function createTransfer({
  walletId,
  currencyCode,
  description,
  type,
  amount,
  toWalletId,
  toCurrencyCode,
  toAmount,
}: TransferInput) {
  const fromWallet = await db.query.wallets.findFirst({
    where: {
      id: walletId,
    },
  });
  if (!fromWallet) {
    return new NotFoundError({ entity: "Wallet", id: walletId });
  }

  const toWallet = await db.query.wallets.findFirst({
    where: {
      id: toWalletId,
    },
  });
  if (!toWallet) {
    return new NotFoundError({ entity: "Wallet", id: toWalletId });
  }

  const fromCurrency = await db.query.currencies.findFirst({
    where: {
      code: currencyCode,
    },
  });
  if (!fromCurrency) {
    return new NotFoundError({ entity: "Currency", id: currencyCode });
  }

  const toCurrency = await db.query.currencies.findFirst({
    where: {
      code: toCurrencyCode,
    },
  });
  if (!toCurrency) {
    return new NotFoundError({ entity: "Currency", id: toCurrencyCode });
  }

  return await db
    .transaction(async (tx) => {
      const { balance } = (
        await tx
          .select({
            balance: sql<string>`coalesce(sum(${transactionEntries.amount}), 0)`,
          })
          .from(transactionEntries)
          .where(
            and(
              eq(transactionEntries.walletId, walletId),
              eq(transactionEntries.currencyId, fromCurrency.id),
            ),
          )
      )[0]!;

      if (parseFloat(balance) < parseFloat(amount)) {
        return new InsufficientFundsError({
          walletId,
          available: balance,
          required: amount,
        });
      }

      const [txn] = await tx
        .insert(transactions)
        .values({
          description: description ?? "",
          type,
        })
        .returning();

      const [debitEntry, creditEntry] = await tx
        .insert(transactionEntries)
        .values([
          {
            transactionId: txn!.id,
            walletId,
            ...createSnapshotEntry({
              currencyId: fromCurrency.id,
              amount: `-${amount}`,
            }),
          },
          {
            transactionId: txn!.id,
            walletId: toWalletId,
            ...createSnapshotEntry({
              currencyId: toCurrency.id,
              amount: toAmount,
            }),
          },
        ])
        .returning();

      return { transaction: txn!, entries: [debitEntry!, creditEntry!] };
    })
    .catch((e) => new DbError({ reason: e.message, cause: e }));
}

export async function createTransaction(input: unknown) {
  const createTransactionInput = createTransactionSchema.safeParse(input);

  if (createTransactionInput.error) {
    return createTransactionInput.error;
  }

  switch (createTransactionInput.data.type) {
    case "income":
      return createIncome(createTransactionInput.data);
    case "expense":
      return createExpense(createTransactionInput.data);
    case "transfer":
      return createTransfer(createTransactionInput.data);
  }
}

export async function listTransactions(input: ListTransactionsInput = {}) {
  const {
    walletId,
    categoryId,
    type,
    limit = 50,
    offset = 0,
    dateFrom,
    dateTo,
  } = input;

  const conditions: SQL[] = [];
  if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
  if (type) conditions.push(eq(transactions.type, type));
  if (dateFrom) conditions.push(gte(transactions.createdAt, dateFrom));
  if (dateTo) conditions.push(lte(transactions.createdAt, dateTo));
  if (walletId) {
    conditions.push(
      sql`${transactions.id} in (
        select ${transactionEntries.transactionId}
        from ${transactionEntries}
        where ${transactionEntries.walletId} = ${walletId}
      )`,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db.query.transactions.findMany({
      where: where
        ? {
            RAW: where,
          }
        : undefined,
      with: {
        category: true,
        entries: {
          with: { wallet: true, currency: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(where),
  ]);

  return { items, total: Number(countResult[0]!.count) };
}

export async function deleteTransaction(id: string) {
  const transaction = await db.query.transactions.findFirst({
    where: {
      id,
    },
  });

  if (!transaction) {
    return new NotFoundError({ entity: "Transaction", id });
  }

  await db.delete(transactions).where(eq(transactions.id, id));

  return { deleted: true };
}
