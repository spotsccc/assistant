---
name: finance
description: >
  Manage personal finances: record expenses, income, transfers, check balances, and generate reports.
  TRIGGER when: user asks to record a transaction, expense, income, transfer between wallets, check balance,
  or get a spending report. Keywords: трата, расход, доход, перевод, баланс, отчёт, потратил, заработал,
  купил, оплатил, списание, пополнение, кошелёк, expense, income, transfer, balance, report.
  Do NOT trigger for: creating/modifying database structure.
allowed-tools:
  - Read
  - Grep
  - finance_mcp__create_income
  - finance-mcp__create_expense
  - finance-mcp__create_transfer
  - assistant-db__list_transactions
  - assistant-db__delete_transaction
  - assistant-db__get_wallets
  - assistant-db__get_wallet_balance
  - assistant-db__create_wallet
  - assistant-db__get_categories
  - assistant-db__create_category
  - assistant-db__spending_report
---

# Finance Skill

Record and query personal financial data stored in PostgreSQL via the `assistant-db` MCP server.

## Transaction Types

### 1. Expense (Трата)

- Use `create_transaction` with `type: "expense"`
- Amount is always positive — the system negates it automatically
- Requires: description, amount, walletId, categoryId

### 2. Income (Пополнение)

- Use `create_transaction` with `type: "income"`
- Amount is positive
- Requires: description, amount, walletId

### 3. Transfer (Перевод)

- Use `create_transaction` with `type: "transfer"`, `walletId` (source), `toWalletId` (destination)
- The system creates two linked transactions automatically
- Category is optional for transfers

## Workflow

### Step 1: Parse the Request

Extract from the user's message:

- **Amount** — number (always positive)
- **Description** — what was bought / reason for transaction
- **Wallet** — which wallet to use
- **Category** — spending/income category
- **Type** — expense, income, or transfer (infer from context)

### Step 2: Resolve References

Before creating a transaction:

1. Call `get_wallets` to find the correct wallet ID
2. Call `get_categories` to find the correct category ID
3. If category doesn't exist, ask the user or create it with `create_category`

### Step 3: Handle Ambiguity

If any required field is unclear or missing, ask the user **one concise clarifying question**. Common cases:

- Wallet not specified and user has multiple wallets
- Category is ambiguous
- Amount is missing
- Transfer destination unclear

Do NOT guess — ask. But do NOT over-ask if the context is obvious.

### Step 4: Create the Transaction

Call `create_transaction` with the resolved data.

### Step 5: Report Back

After creating the transaction, call `get_wallet_balance` and reply with a **concise confirmation** including:

- What was created (description, amount, wallet, category)
- Updated wallet balance

Example reply format for an expense:

```
Записал: Булочка -200 ARS (Наличка ARS, Продукты)
Баланс Наличка ARS: 15 300 $
```

Example reply format for a transfer:

```
Перевод: 100 USD Tinkoff → Наличка
Баланс Tinkoff: 500 $
Баланс Наличка: 300 $
```

## Constraints

- NEVER create transactions without confirming ambiguous details first
- Always respond in the same language as the user's message (default: Russian)
- Keep responses short and action-oriented — no unnecessary explanations
