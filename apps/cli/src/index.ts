import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import * as errore from "errore";

const CONFIG_DIR = path.join(os.homedir(), ".assistant");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

interface Config {
  databaseUrl?: string;
  geckoApiKey?: string;
  openExchangeRatesAppId?: string;
}

type ConfigUpdate = {
  [Key in keyof Config]?: Config[Key] | null;
};

const CONFIG_ENV_MAPPINGS = [
  ["databaseUrl", "DATABASE_URL"],
  ["geckoApiKey", "GECKO_API_KEY"],
  ["openExchangeRatesAppId", "OPEN_EXCHANGE_RATES_APP_ID"],
] as const satisfies ReadonlyArray<[keyof Config, string]>;

function parseConfigValue(value: unknown): Config | Error {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return new Error("Config must be a JSON object");
  }

  const candidate = value as Record<string, unknown>;
  const nextConfig: Config = {};

  if ("databaseUrl" in candidate) {
    if (typeof candidate.databaseUrl !== "string") {
      return new Error("Config field databaseUrl must be a string");
    }
    nextConfig.databaseUrl = candidate.databaseUrl;
  }

  if ("geckoApiKey" in candidate) {
    if (typeof candidate.geckoApiKey !== "string") {
      return new Error("Config field geckoApiKey must be a string");
    }
    nextConfig.geckoApiKey = candidate.geckoApiKey;
  }

  if ("openExchangeRatesAppId" in candidate) {
    if (typeof candidate.openExchangeRatesAppId !== "string") {
      return new Error("Config field openExchangeRatesAppId must be a string");
    }
    nextConfig.openExchangeRatesAppId = candidate.openExchangeRatesAppId;
  }

  return nextConfig;
}

function readConfig(): Config {
  const raw = errore.try({
    try: () => fs.readFileSync(CONFIG_FILE, "utf-8"),
    catch: () => new Error("Config not found"),
  });
  if (raw instanceof Error) return {};
  const parsed = errore.try({
    try: () => JSON.parse(raw) as unknown,
    catch: () => new Error("Invalid config"),
  });
  if (parsed instanceof Error) return {};
  const config = parseConfigValue(parsed);
  if (config instanceof Error) return {};
  return config;
}

function writeConfig(config: Config) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function mergeConfig(update: ConfigUpdate) {
  const currentConfig = readConfig();
  const nextConfig: Config = { ...currentConfig };

  for (const [key, value] of Object.entries(update) as Array<
    [keyof Config, string | null]
  >) {
    if (value === null) {
      delete nextConfig[key];
      continue;
    }
    nextConfig[key] = value;
  }

  writeConfig(nextConfig);
}

function parseConfigUpdate(json: string) {
  const parsed = errore.try({
    try: () => JSON.parse(json) as unknown,
    catch: () => new Error("Config update must be valid JSON"),
  });
  if (parsed instanceof Error) {
    return parsed;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return new Error("Config update must be a JSON object");
  }

  const candidate = parsed as Record<string, unknown>;
  const nextConfig: ConfigUpdate = {};
  const supportedKeys = new Set(CONFIG_ENV_MAPPINGS.map(([key]) => key));

  for (const key of Object.keys(candidate)) {
    if (!supportedKeys.has(key as keyof Config)) {
      return new Error(`Unsupported config field: ${key}`);
    }
  }

  if ("databaseUrl" in candidate) {
    if (candidate.databaseUrl !== null && typeof candidate.databaseUrl !== "string") {
      return new Error("Config field databaseUrl must be a string or null");
    }
    nextConfig.databaseUrl = candidate.databaseUrl as string | null;
  }

  if ("geckoApiKey" in candidate) {
    if (candidate.geckoApiKey !== null && typeof candidate.geckoApiKey !== "string") {
      return new Error("Config field geckoApiKey must be a string or null");
    }
    nextConfig.geckoApiKey = candidate.geckoApiKey as string | null;
  }

  if ("openExchangeRatesAppId" in candidate) {
    if (
      candidate.openExchangeRatesAppId !== null &&
      typeof candidate.openExchangeRatesAppId !== "string"
    ) {
      return new Error(
        "Config field openExchangeRatesAppId must be a string or null",
      );
    }
    nextConfig.openExchangeRatesAppId =
      candidate.openExchangeRatesAppId as string | null;
  }

  return nextConfig;
}

function hydrateEnvFromConfig() {
  const config = readConfig();

  for (const [configKey, envKey] of CONFIG_ENV_MAPPINGS) {
    const value = config[configKey];
    if (!process.env[envKey] && value) {
      process.env[envKey] = value;
    }
  }
}

const command = process.argv[2];
const jsonArg = process.argv[3];

if (!command) {
  console.error("Usage: assistant <command> [json-args]");
  process.exit(1);
}

if (command === "auth") {
  if (!jsonArg) {
    console.error("Usage: assistant auth <database-url>");
    process.exit(1);
  }
  mergeConfig({ databaseUrl: jsonArg });
  console.log("Database URL saved.");
  process.exit(0);
}

if (command === "config") {
  if (!jsonArg) {
    console.error(
      'Usage: assistant config \'{"geckoApiKey":"...","openExchangeRatesAppId":"..."}\'',
    );
    process.exit(1);
  }
  const configUpdate = parseConfigUpdate(jsonArg);
  if (configUpdate instanceof Error) {
    console.error(configUpdate.message);
    process.exit(1);
  }
  mergeConfig(configUpdate);
  console.log("Config saved.");
  process.exit(0);
}

hydrateEnvFromConfig();

const {
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
} = await import("@repo/service/operations");

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

const handler = commands[command];
if (!handler) {
  console.error(
    `Unknown command: ${command}\nAvailable: auth, config, ${Object.keys(commands).join(", ")}`,
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
  console.error(error);
  process.exit(1);
}
