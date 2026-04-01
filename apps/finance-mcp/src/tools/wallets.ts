import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getWallets,
  getWalletBalance,
  createWallet,
  createWalletSchema,
  getWalletBalanceSchema,
} from "@repo/service/operations";

export function registerWalletTools(server: McpServer) {
  server.tool(
    "get_wallets",
    "Get all wallets with their current balances per currency",
    {},
    async () => {
      const result = await getWallets();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_wallet_balance",
    "Get the current balances of a specific wallet (per currency)",
    getWalletBalanceSchema.shape,
    async (input) => {
      const result = await getWalletBalance(input.walletId);
      if (result instanceof Error) {
        return { content: [{ type: "text", text: result.message }], isError: true };
      }
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_wallet",
    "Create a new wallet",
    createWalletSchema.shape,
    async (input) => {
      const result = await createWallet(input);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
