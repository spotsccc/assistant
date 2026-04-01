import { db } from "./index";
import { currencies, categories, wallets } from "./schema/index";

async function seed() {
  console.log("Seeding currencies...");
  await db
    .insert(currencies)
    .values([
      { code: "ARS", name: "Argentine Peso", symbol: "$" },
      { code: "RUB", name: "Russian Ruble", symbol: "₽" },
      { code: "USDT", name: "Tether", symbol: "₮" },
      { code: "USD", name: "US Dollar", symbol: "$" },
      { code: "ETH", name: "Ethereum", symbol: "Ξ" },
    ])
    .onConflictDoNothing();

  console.log("Seeding categories...");
  await db
    .insert(categories)
    .values([
      { name: "Продукты" },
      { name: "Такси" },
      { name: "Доставка" },
      { name: "Спорт" },
      { name: "Психолог" },
      { name: "Собака" },
      { name: "ИИ" },
      { name: "Техническая" },
      { name: "Английский" },
      { name: "Игры" },
      { name: "Медицина" },
      { name: "Повар" },
    ])
    .onConflictDoNothing();

  console.log("Seeding wallets...");
  await db
    .insert(wallets)
    .values([{ name: "Наличка" }, { name: "Tinkoff" }])
    .onConflictDoNothing();

  console.log("Seed complete.");
  process.exit(0);
}

seed();
