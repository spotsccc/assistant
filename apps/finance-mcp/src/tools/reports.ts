import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { spendingReport, spendingReportSchema } from "@repo/service/operations";

export function registerReportTools(server: McpServer) {
  server.tool(
    "spending_report",
    "Get a spending report grouped by category, day, week, or month",
    spendingReportSchema.shape,
    async (input) => {
      const result = await spendingReport(input);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
