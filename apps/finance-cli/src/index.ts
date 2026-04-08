import {
  createTransaction,
  listTransactions,
  deleteTransaction,
  incomeSchema,
  expenseSchema,
  transferSchema,
  listTransactionsSchema,
  deleteTransactionSchema,
  getWallets,
  getWalletBalance,
  createWallet,
  createWalletSchema,
  getWalletBalanceSchema,
  getCategories,
  createCategory,
  deleteCategory,
  createCategorySchema,
  deleteCategorySchema,
  spendingReport,
  spendingReportSchema,
} from "@repo/service/operations";

type Handler = (input: Record<string, unknown>) => Promise<unknown>;

const commands: Record<string, Handler> = {
  "create-income": async (input) => {
    const parsed = incomeSchema.omit({ type: true }).parse(input);
    const result = await createTransaction({ ...parsed, type: "income" });
    if (result instanceof Error) throw result;
    return result;
  },

  "create-expense": async (input) => {
    const parsed = expenseSchema.omit({ type: true }).parse(input);
    const result = await createTransaction({ ...parsed, type: "expense" });
    if (result instanceof Error) throw result;
    return result;
  },

  "create-transfer": async (input) => {
    const parsed = transferSchema.omit({ type: true }).parse(input);
    const result = await createTransaction({ ...parsed, type: "transfer" });
    if (result instanceof Error) throw result;
    return result;
  },

  "list-transactions": async (input) => {
    const parsed = listTransactionsSchema.parse(input);
    return listTransactions(parsed);
  },

  "delete-transaction": async (input) => {
    const parsed = deleteTransactionSchema.parse(input);
    const result = await deleteTransaction(parsed.id);
    if (result instanceof Error) throw result;
    return result;
  },

  "get-wallets": async () => {
    return getWallets();
  },

  "get-wallet-balance": async (input) => {
    const parsed = getWalletBalanceSchema.parse(input);
    const result = await getWalletBalance(parsed.walletId);
    if (result instanceof Error) throw result;
    return result;
  },

  "create-wallet": async (input) => {
    const parsed = createWalletSchema.parse(input);
    return createWallet(parsed);
  },

  "get-categories": async () => {
    return getCategories();
  },

  "create-category": async (input) => {
    const parsed = createCategorySchema.parse(input);
    return createCategory(parsed);
  },

  "delete-category": async (input) => {
    const parsed = deleteCategorySchema.parse(input);
    const result = await deleteCategory(parsed.id);
    if (result instanceof Error) throw result;
    return result;
  },

  "spending-report": async (input) => {
    const parsed = spendingReportSchema.parse(input);
    return spendingReport(parsed);
  },
};

const command = process.argv[2];
const jsonArg = process.argv[3];

if (!command) {
  console.error(
    `Usage: finance <command> [json-args]\nCommands: ${Object.keys(commands).join(", ")}`,
  );
  process.exit(1);
}

const handler = commands[command];
if (!handler) {
  console.error(
    `Unknown command: ${command}\nAvailable: ${Object.keys(commands).join(", ")}`,
  );
  process.exit(1);
}

try {
  const input = jsonArg
    ? (JSON.parse(jsonArg) as Record<string, unknown>)
    : {};
  const result = await handler(input);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
