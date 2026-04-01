import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTransactionTools } from "./tools/transactions";
import { registerWalletTools } from "./tools/wallets";
import { registerCategoryTools } from "./tools/categories";
import { registerReportTools } from "./tools/reports";

const server = new McpServer({
  name: "assistant-db",
  version: "0.0.1",
});

registerTransactionTools(server);
registerWalletTools(server);
registerCategoryTools(server);
registerReportTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
