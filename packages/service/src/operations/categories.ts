import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "../index";
import { categories } from "../schema/index";
import { NotFoundError } from "./errors";

export const createCategorySchema = z.object({
  name: z.string().describe("Category name"),
});

export const deleteCategorySchema = z.object({
  id: z.string().uuid().describe("Category ID"),
});

export async function getCategories() {
  return db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.name)],
  });
}

export async function createCategory(input: { name: string }) {
  const [category] = await db
    .insert(categories)
    .values({ name: input.name })
    .returning();

  return category!;
}

export async function deleteCategory(id: string) {
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });

  if (!category) {
    return new NotFoundError({ entity: "Category", id });
  }

  await db.delete(categories).where(eq(categories.id, id));

  return { deleted: true };
}
