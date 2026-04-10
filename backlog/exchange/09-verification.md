# Task 09: проверка и критерии выпуска

## Цель

Проверить, что новая FX-функциональность не ломает текущие сценарии и даёт корректные агрегаты.

## Зависимости

- Все предыдущие задачи.

## Обязательные проверки

### Type checks

- `pnpm --filter @repo/service check-types`
- `pnpm --filter web check-types`
- `pnpm --filter @repo/service db:generate`

### Smoke-сценарии

Подготовить сценарии минимум для следующих кейсов:

1. `income` в `USD`
2. `expense` в `ARS` с заполнением `snapshot_*`
3. mono-currency transfer
4. cross-currency transfer
5. `financeSummary` без `convertTo`
6. `financeSummary` с `convertTo=USD`
7. `spendingReport` без `convertTo`, где есть две валюты
8. `totalBalance` в display currency
9. смена display currency через settings

## Что проверять руками

- Сохранение native amount не искажается snapshot-конвертацией.
- Исторические отчёты не используют live rate по ошибке.
- Current total balance использует live rate, а не snapshot historical rate.
- UI не смешивает валюты без явного target currency.

## Критерии готовности

- Нет скрытого смешивания разных валют в одном total по умолчанию.
- Новые записи сохраняют `snapshot_*`, когда это требуется.
- Ошибки получения rates видимы и типизированы.
- Web и CLI работают через service layer без дублирования логики.
