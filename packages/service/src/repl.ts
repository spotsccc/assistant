import * as dotenv from "dotenv";
import repl from "node:repl";
import { fileURLToPath } from "node:url";

const envPath = fileURLToPath(new URL("../.env", import.meta.url));
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.warn(`Failed to load ${envPath}:`, envResult.error);
}

const [{ createCategory }, { fetchFiatExchangeRate }] = await Promise.all([
  import("./operations/categories"),
  import("./operations/exchange-rates"),
]);

const r = repl.start("app> ");
Object.assign(r.context, { createCategory, fetchFiatExchangeRate });
