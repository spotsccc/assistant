import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getCategories,
  createCategory,
  deleteCategory,
  createCategorySchema,
  deleteCategorySchema,
} from "@repo/service/operations";

export function registerCategoryTools(server: McpServer) {
  server.tool(
    "get_categories",
    "Get all transaction categories",
    {},
    async () => {
      const result = await getCategories();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_category",
    "Create a new transaction category",
    createCategorySchema.shape,
    async (input) => {
      const result = await createCategory(input);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "delete_category",
    "Delete a transaction category by ID",
    deleteCategorySchema.shape,
    async (input) => {
      const result = await deleteCategory(input.id);
      if (result instanceof Error) {
        return { content: [{ type: "text", text: result.message }], isError: true };
      }
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
