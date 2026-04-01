import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  createTransaction,
  listTransactions,
  deleteTransaction,
  incomeSchema,
  expenseSchema,
  transferSchema,
  listTransactionsSchema,
  deleteTransactionSchema,
} from "@repo/service/operations";

export function registerTransactionTools(server: McpServer) {
  server.registerTool("create_income", {
    description: "Record an income transaction (salary, freelance, etc.)",
    inputSchema: incomeSchema.omit({ type: true }),
  }, async (input) => {
    const result = await createTransaction({ ...input, type: "income" });
    if (result instanceof Error) {
      return { content: [{ type: "text", text: result.message }], isError: true };
    }
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("create_expense", {
    description: "Record an expense transaction (requires a category)",
    inputSchema: expenseSchema.omit({ type: true }),
  }, async (input) => {
    const result = await createTransaction({ ...input, type: "expense" });
    if (result instanceof Error) {
      return { content: [{ type: "text", text: result.message }], isError: true };
    }
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("create_transfer", {
    description: "Transfer money between wallets (supports cross-currency)",
    inputSchema: transferSchema.omit({ type: true }),
  }, async (input) => {
    const result = await createTransaction({ ...input, type: "transfer" });
    if (result instanceof Error) {
      return { content: [{ type: "text", text: result.message }], isError: true };
    }
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });

  server.tool(
    "list_transactions",
    "List transactions with optional filters",
    listTransactionsSchema.shape,
    async (input) => {
      const result = await listTransactions(input);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "delete_transaction",
    "Delete a transaction by ID (entries are cascade-deleted)",
    deleteTransactionSchema.shape,
    async (input) => {
      const result = await deleteTransaction(input.id);
      if (result instanceof Error) {
        return { content: [{ type: "text", text: result.message }], isError: true };
      }
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
