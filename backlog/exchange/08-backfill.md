# Task 08: backfill исторических данных

## Цель

Заполнить snapshot-поля у существующих записей настолько полно, насколько это позволяет доступность historical rates.

## Зависимости

- [01-schema-and-migrations.md](./01-schema-and-migrations.md)
- [02-exchange-rate-service.md](./02-exchange-rate-service.md)
- [03-transaction-snapshots.md](./03-transaction-snapshots.md)

## Область изменений

- отдельный script или service-operation в `packages/service`

## Стратегия backfill

### Для `income` и `expense`

- Найти entries без `snapshot_amount`.
- Взять `transactions.created_at`.
- Получить historical rate в `USD`.
- Заполнить `snapshot_*`.

### Для `transfer`

- Если обе стороны в одной валюте, backfill такой же, как для обычных entries.
- Если transfer cross-currency:
  - сначала использовать доступные historical rates в `USD`;
  - если reliable historical data нет, оставить `snapshot_* = null` и залогировать пропуск.

## Требования

- Backfill должен быть идемпотентным.
- Уже заполненные `snapshot_*` не должны перезаписываться без явного флага.
- Пропуски должны быть видимы в логах, а не теряться молча.

## Acceptance Criteria

- Существующие `income/expense` entries можно массово заполнить через backfill.
- Повторный запуск не дублирует и не ломает данные.
- По завершении есть понятный отчёт: сколько записей обновлено, сколько пропущено, почему.
