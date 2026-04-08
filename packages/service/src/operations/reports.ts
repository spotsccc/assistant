import { eq, and, gte, lte, sql, inArray, type SQL } from "drizzle-orm";
import z from "zod";
import { db } from "../index";
import {
  transactions,
  transactionEntries,
  categories,
  currencies,
} from "../schema/index";

export const spendingReportSchema = z.object({
  walletId: z.string().uuid().optional().describe("Filter by wallet ID"),
  dateFrom: z.coerce.date().optional().describe("Start date (ISO string)"),
  dateTo: z.coerce.date().optional().describe("End date (ISO string)"),
  groupBy: z
    .enum(["category", "day", "week", "month"])
    .describe("How to group spending data"),
});

export type SpendingReportInput = z.infer<typeof spendingReportSchema>;

export async function spendingReport(input: SpendingReportInput) {
  const conditions: SQL[] = [eq(transactions.type, "expense")];

  if (input.walletId) {
    conditions.push(eq(transactionEntries.walletId, input.walletId));
  }
  if (input.dateFrom) {
    conditions.push(gte(transactions.createdAt, input.dateFrom));
  }
  if (input.dateTo) {
    conditions.push(lte(transactions.createdAt, input.dateTo));
  }

  const where = and(...conditions);

  const baseQuery = db
    .select({
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      total: sql<string>`sum(abs(${transactionEntries.amount}))`,
      count: sql<number>`count(distinct ${transactions.id})`,
    })
    .from(transactions)
    .innerJoin(
      transactionEntries,
      eq(transactionEntries.transactionId, transactions.id),
    )
    .leftJoin(categories, eq(transactions.categoryId, categories.id));

  if (input.groupBy === "category") {
    return await baseQuery
      .where(where)
      .groupBy(transactions.categoryId, categories.name)
      .orderBy(sql`sum(abs(${transactionEntries.amount})) desc`);
  }

  const dateGroup = {
    day: sql`date_trunc('day', ${transactions.createdAt})`,
    week: sql`date_trunc('week', ${transactions.createdAt})`,
    month: sql`date_trunc('month', ${transactions.createdAt})`,
  }[input.groupBy];

  return await db
    .select({
      period: dateGroup.as("period"),
      total: sql<string>`sum(abs(${transactionEntries.amount}))`,
      count: sql<number>`count(distinct ${transactions.id})`,
    })
    .from(transactions)
    .innerJoin(
      transactionEntries,
      eq(transactionEntries.transactionId, transactions.id),
    )
    .where(where)
    .groupBy(dateGroup)
    .orderBy(dateGroup);
}

export const incomeReportSchema = z.object({
  walletId: z.string().uuid().optional().describe("Filter by wallet ID"),
  dateFrom: z.coerce.date().optional().describe("Start date (ISO string)"),
  dateTo: z.coerce.date().optional().describe("End date (ISO string)"),
  groupBy: z
    .enum(["day", "week", "month"])
    .describe("How to group income data"),
});

export type IncomeReportInput = z.infer<typeof incomeReportSchema>;

export async function incomeReport(input: IncomeReportInput) {
  const conditions: SQL[] = [eq(transactions.type, "income")];

  if (input.walletId) {
    conditions.push(eq(transactionEntries.walletId, input.walletId));
  }
  if (input.dateFrom) {
    conditions.push(gte(transactions.createdAt, input.dateFrom));
  }
  if (input.dateTo) {
    conditions.push(lte(transactions.createdAt, input.dateTo));
  }

  const where = and(...conditions);

  const dateGroup = {
    day: sql`date_trunc('day', ${transactions.createdAt})`,
    week: sql`date_trunc('week', ${transactions.createdAt})`,
    month: sql`date_trunc('month', ${transactions.createdAt})`,
  }[input.groupBy];

  return await db
    .select({
      period: dateGroup.as("period"),
      total: sql<string>`sum(${transactionEntries.amount})`,
      count: sql<number>`count(distinct ${transactions.id})`,
    })
    .from(transactions)
    .innerJoin(
      transactionEntries,
      eq(transactionEntries.transactionId, transactions.id),
    )
    .where(where)
    .groupBy(dateGroup)
    .orderBy(dateGroup);
}

export const financeSummarySchema = z.object({
  walletId: z.string().uuid().optional().describe("Filter by wallet ID"),
  dateFrom: z.coerce.date().optional().describe("Start date (ISO string)"),
  dateTo: z.coerce.date().optional().describe("End date (ISO string)"),
});

export type FinanceSummaryInput = z.infer<typeof financeSummarySchema>;

export async function financeSummary(input: FinanceSummaryInput) {
  const conditions: SQL[] = [
    inArray(transactions.type, ["income", "expense"]),
  ];

  if (input.walletId) {
    conditions.push(eq(transactionEntries.walletId, input.walletId));
  }
  if (input.dateFrom) {
    conditions.push(gte(transactions.createdAt, input.dateFrom));
  }
  if (input.dateTo) {
    conditions.push(lte(transactions.createdAt, input.dateTo));
  }

  const where = and(...conditions);

  const rows = await db
    .select({
      currencyCode: currencies.code,
      currencySymbol: currencies.symbol,
      totalIncome: sql<string>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactionEntries.amount} else 0 end), 0)`,
      totalExpenses: sql<string>`coalesce(sum(case when ${transactions.type} = 'expense' then abs(${transactionEntries.amount}) else 0 end), 0)`,
    })
    .from(transactions)
    .innerJoin(
      transactionEntries,
      eq(transactionEntries.transactionId, transactions.id),
    )
    .innerJoin(currencies, eq(transactionEntries.currencyId, currencies.id))
    .where(where)
    .groupBy(currencies.code, currencies.symbol);

  return rows.map((row) => ({
    ...row,
    net: (parseFloat(row.totalIncome) - parseFloat(row.totalExpenses)).toString(),
  }));
}
