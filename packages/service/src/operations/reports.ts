import { eq, and, gte, lte, sql, type SQL } from "drizzle-orm";
import z from "zod";
import { db } from "../index";
import {
  transactions,
  transactionEntries,
  categories,
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
