# Task 05: общий баланс в одной валюте

## Цель

Добавить отдельную операцию для расчёта текущего общего баланса по всем кошелькам в одной target currency.

## Зависимости

- [01-schema-and-migrations.md](./01-schema-and-migrations.md)
- [02-exchange-rate-service.md](./02-exchange-rate-service.md)

## Область изменений

- `packages/service/src/operations/wallets.ts`

## Новый API

```ts
totalBalance(input: {
  convertTo: string;
  walletId?: string;
})
```

`walletId` опционален, чтобы ту же операцию можно было использовать и для одной страницы кошелька, и для всего дашборда.

## Логика

1. Получить текущие balances по wallet/currency из `transaction_entries`.
2. Для каждой валютной суммы:
   - если валюта уже совпадает с `convertTo`, взять сумму как есть;
   - иначе получить live rate через FX service.
3. Сложить всё в target currency.

## Требования

- Операция должна жить в service layer.
- Операция не должна менять существующий контракт `getWallets()` и `getWalletBalance()`.
- Ошибки отсутствующих валют или курса должны возвращаться как `Error | T`.

## Acceptance Criteria

- Сервис умеет вернуть total balance по всем кошелькам в одной валюте.
- Сервис умеет вернуть total balance по одному кошельку через тот же API.
- Для current balances используется live/cache rate, а не historical snapshot.
