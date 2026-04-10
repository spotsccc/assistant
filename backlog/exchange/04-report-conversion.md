# Task 04: конвертация отчётов

## Цель

Исправить отчёты так, чтобы они либо:

- явно работали в target currency через `convertTo`;
- либо возвращали данные без смешивания разных валют в один total.

## Зависимости

- [01-schema-and-migrations.md](./01-schema-and-migrations.md)
- [02-exchange-rate-service.md](./02-exchange-rate-service.md)
- [03-transaction-snapshots.md](./03-transaction-snapshots.md)

## Область изменений

- `packages/service/src/operations/reports.ts`

## Операции

### `financeSummary`

Добавить опциональный параметр:

```ts
convertTo?: string
```

Правила:

- Без `convertTo` поведение остаётся multi-currency, как сейчас.
- С `convertTo` сумма агрегируется в одной валюте.
- Если `convertTo === USD`, можно использовать `snapshot_amount`.
- Если `convertTo !== USD`, нужно конвертировать через historical rates на read-path.

### `spendingReport`

Добавить `convertTo?: string`.

Правила:

- Без `convertTo` нельзя суммировать разные валюты в одну строку.
- Для category/time grouping результат должен быть либо:
  - сгруппирован ещё и по валюте;
  - либо возвращён в `convertTo`.

### `incomeReport`

Добавить `convertTo?: string` по тем же правилам.

## Контракт ответов

Нужно сохранить API удобным для UI, но убрать скрытое смешивание валют.

Предпочтительный вариант для v1:

- без `convertTo` в ответе явно есть `currencyCode` и `currencySymbol`;
- с `convertTo` ответ содержит данные только в target currency.

## Особенности реализации

- Для historical period reports дата конвертации должна соответствовать времени исходной транзакции, а не текущему времени.
- Для snapshot в `USD` не нужен лишний JOIN на `exchange_rates`, если хватает `snapshot_*`.

## Acceptance Criteria

- `financeSummary` поддерживает `convertTo`.
- `spendingReport` больше не смешивает разные валюты в одну сумму по умолчанию.
- `incomeReport` больше не смешивает разные валюты в одну сумму по умолчанию.
- Historical conversion использует момент транзакции, а не live rate.
