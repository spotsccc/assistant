# Assistant — Personal Finance & Productivity Platform

Turborepo monorepo: MCP servers, OpenClaw bundles, and web UI for building a personal assistant.

## Project Structure

```
apps/web              — Next.js 16 + Mantine v7 + TanStack Query (port 3000)
apps/finance-mcp      — MCP server (stdio) for finance, thin wrapper over service operations
bundles/finance       — OpenClaw skill bundle for personal finance tracking
packages/service      — Drizzle ORM: schema, client, operations (business logic)
```

## Key Architectural Rules

- **All business logic lives in `packages/service/src/operations/`**. Both `apps/web` API routes and `apps/finance-mcp` tools are thin wrappers — they accept input, call an operation, return the result. Never put business logic in route handlers or MCP tools.
- **Wallet balance is computed** as `SUM(transactions.amount)` — never stored as a column.
- **Transfers create two linked transactions** (debit + credit) inside a single DB transaction, linked via `linked_transaction_id`.
- **Expense amounts are stored negative, income positive.** The `createTransaction` operation handles sign conversion — callers always pass a positive number.

## Tech Stack

| Layer      | Technology                                                     |
| ---------- | -------------------------------------------------------------- |
| DB         | PostgreSQL + Drizzle ORM (`postgres` driver)                   |
| Web        | Next.js App Router, Mantine v7, TanStack Query, Mantine Charts |
| MCP        | `@modelcontextprotocol/sdk`, stdio transport                   |
| Bundles    | OpenClaw skill bundles (skills + MCP config)                   |
| Validation | Zod (MCP tool inputs)                                          |
| Build      | Turborepo, pnpm workspaces                                     |

## Common Commands

```bash
pnpm install                          # install all deps
pnpm --filter web dev                 # start web app (port 3000)
pnpm --filter @repo/service db:push        # push schema to database
pnpm --filter @repo/service db:generate    # generate migration
pnpm --filter @repo/service db:migrate     # run migrations
pnpm --filter @repo/service db:seed        # seed initial data
pnpm --filter @repo/service db:studio      # open Drizzle Studio
```

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (required by web, finance-mcp, service)

## Module Imports

`packages/service` exports via three entry points:

```typescript
import { createDb, type Db } from "@repo/service";          // client + types
import { transactions, wallets, ... } from "@repo/service/schema"; // raw tables
import { createTransaction, getWallets, ... } from "@repo/service/operations"; // business logic
```

Both `apps/finance-mcp` and `apps/web` use `Bundler` module resolution. Internal imports use extensionless paths (`./schema`, not `./schema.js`). Exception: `@modelcontextprotocol/sdk` subpath imports require `.js` extension (`@modelcontextprotocol/sdk/server/mcp.js`).

## Database Schema (4 tables)

- `currencies` — code, name, symbol
- `categories` — name (unique)
- `wallets` — name, currency_id (FK), group
- `transactions` — description, amount, type (enum: income/expense/transfer), category_id, wallet_id, linked_transaction_id

Full spec with column types: [SPEC.md](./SPEC.md)

## Code Style

- TypeScript strict mode, `noUncheckedIndexedAccess: true`
- ESM everywhere (`"type": "module"`)
- No default exports in packages (only in Next.js pages/layouts where required)
- Russian language for user-facing content and category/wallet names
- English for code, comments, commit messages

This codebase uses the errore.org convention. ALWAYS read the errore skill before editing any code.
