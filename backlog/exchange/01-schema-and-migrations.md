# Task 01: схема и миграции

## Цель

Добавить структуру данных для:

- классификации валют;
- app-wide настройки display currency;
- кэша курсов валют;
- historical snapshot-полей в `transaction_entries`.

## Зависимости

- Нет.

## Изменения в схеме

### `currencies`

Добавить `kind`:

- `fiat`
- `crypto`

Это уберёт эвристику "определяем тип валюты по коду" из бизнес-логики.

### `app_settings`

Добавить singleton-таблицу для app-wide настроек:

- `key` `varchar` PK, фиксированное значение `default`
- `default_display_currency_id` FK -> `currencies.id`
- `created_at`
- `updated_at`

В текущей схеме нет пользователей, поэтому user-specific settings пока не нужны.

### `exchange_rates`

Добавить таблицу кэша курсов:

- `id` UUID PK
- `base_currency_id` FK -> `currencies.id`
- `quote_currency_id` FK -> `currencies.id`
- `rate` NUMERIC(36, 18)
- `effective_at` TIMESTAMP
- `granularity` enum: `live | daily`
- `source` VARCHAR
- `created_at` TIMESTAMP
- unique constraint на `base_currency_id`, `quote_currency_id`, `effective_at`, `granularity`

### `transaction_entries`

Добавить nullable snapshot-поля:

- `snapshot_currency_id` FK -> `currencies.id`
- `snapshot_amount` NUMERIC(36, 18)
- `snapshot_rate` NUMERIC(36, 18)

Поля должны остаться nullable на первом этапе, чтобы не ломать уже существующие записи.

## Изменения в Drizzle

- Обновить файлы схемы в `packages/service/src/schema`.
- Подключить новые таблицы и relation-описания в `packages/service/src/schema/index.ts`.
- Сгенерировать новую миграцию в `packages/service/drizzle`.

## Дополнительные требования

- Не менять существующую модель `transactions` + `transaction_entries`.
- Не хранить snapshot в mutable display currency.
- Не добавлять сетевые вызовы или бизнес-логику в схему.

## Acceptance Criteria

- `currencies.kind` присутствует в схеме и миграции.
- В БД существует `app_settings` с дефолтной строкой `default`.
- В БД существует `exchange_rates`.
- `transaction_entries` содержит nullable `snapshot_*` поля.
- Все новые сущности экспортируются через `@repo/service/schema`.
- `pnpm --filter @repo/service check-types` проходит после изменения схемы.
