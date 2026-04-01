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
  - finance-mcp__create_income
  - finance-mcp__create_expense
  - finance-mcp__create_transfer
  - finance-mcp__list_transactions
  - finance-mcp__delete_transaction
  - finance-mcp__get_wallets
  - finance-mcp__get_wallet_balance
  - finance-mcp__create_wallet
  - finance-mcp__get_categories
  - finance-mcp__create_category
  - finance-mcp__delete_category
  - finance-mcp__spending_report
---

# Finance Skill

Record and query personal financial data stored in PostgreSQL via the `finance-mcp` MCP server.

## Transaction Types

### 1. Expense (Трата)

- Use `create_expense`
- Amount is always positive — the system negates it automatically
- Requires: amount, walletId, currencyCode, categoryId
- Optional: description

### 2. Income (Пополнение)

- Use `create_income`
- Amount is positive
- Requires: amount, walletId, currencyCode
- Optional: description

### 3. Transfer (Перевод)

- Use `create_transfer` with `walletId` (source), `toWalletId` (destination)
- The system creates two linked transactions automatically
- Requires: amount, walletId, currencyCode, toWalletId, toCurrencyCode, toAmount
- Optional: description
- For same-currency transfers, `toAmount` equals `amount`

## Workflow

### Step 1: Parse the Request

Extract from the user's message:

- **Amount** — number (always positive)
- **Currency** — currency code (e.g. ARS, RUB, USDT)
- **Description** — what was bought / reason for transaction (optional)
- **Wallet** — which wallet to use
- **Category** — spending category (required for expenses only)
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

Call the appropriate tool (`create_expense`, `create_income`, or `create_transfer`) with the resolved data.

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
