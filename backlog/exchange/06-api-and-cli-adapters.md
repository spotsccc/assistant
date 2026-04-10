# Task 06: API routes и CLI adapters

## Цель

Пробросить новые параметры и операции в web API и CLI, не вынося туда бизнес-логику.

## Зависимости

- [02-exchange-rate-service.md](./02-exchange-rate-service.md)
- [04-report-conversion.md](./04-report-conversion.md)
- [05-total-balance.md](./05-total-balance.md)

## Область изменений

- `apps/web/app/api/**`
- `apps/cli/src/index.ts`
- `packages/service/src/operations/index.ts`

## Web API

### Обновить существующие routes

- `/api/reports/summary`
- `/api/reports/spending`
- `/api/reports/income`

Добавить поддержку:

- `convertTo`

### Добавить новые routes

- `/api/reports/total-balance`
- `/api/settings`

`/api/settings` должен уметь хотя бы:

- `GET` текущих app settings
- `PATCH` display currency

## CLI

Добавить или расширить команды:

- `spending-report` -> поддержка `convertTo`
- `income-report`
- `finance-summary`
- `total-balance`
- `get-settings`
- `update-settings`

CLI остаётся thin wrapper над `@repo/service/operations`.

## Требования

- Не добавлять в routes и CLI логику выбора провайдера или расчёта курсов.
- Соблюдать текущий стиль обработки ошибок.
- Учитывать, что актуальный CLI находится в `apps/cli`, а не в отдельном `apps/finance-cli`.

## Acceptance Criteria

- Все новые service-операции экспортируются из `packages/service/src/operations/index.ts`.
- Web API умеет принимать `convertTo`.
- CLI умеет работать с новыми операциями без дублирования бизнес-логики.
