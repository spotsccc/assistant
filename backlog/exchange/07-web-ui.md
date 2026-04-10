# Task 07: web UI

## Цель

Добавить в интерфейс отображение агрегатов в выбранной валюте и экран настройки display currency.

## Зависимости

- [04-report-conversion.md](./04-report-conversion.md)
- [05-total-balance.md](./05-total-balance.md)
- [06-api-and-cli-adapters.md](./06-api-and-cli-adapters.md)

## Область изменений

- `apps/web/app/page.tsx`
- `apps/web/app/settings/page.tsx`
- `apps/web/app/wallets/**`
- при необходимости `apps/web/app/transactions/page.tsx`

## Изменения UI

### Dashboard

- Добавить переключатель display currency.
- Загружать default value из `/api/settings`.
- Использовать `convertTo` при запросе summary и report data.
- Показать current total balance в display currency отдельным блоком.

### Settings

- Заменить placeholder-страницу реальной формой настройки display currency.
- Использовать список валют из `/api/currencies`.
- Сохранять значение через `/api/settings`.

### Wallet pages

- Оставить native balances как есть.
- Дополнительно показать converted total для выбранной display currency.

### Transactions list

- Опционально показать `snapshot amount` вторичной строкой, если поле заполнено.

## UX-ограничения

- Не ломать существующее отображение native balances.
- Не скрывать исходную валюту транзакции при отображении converted data.
- Если конвертация недоступна, показывать понятное fallback-состояние, а не silently zero.

## Acceptance Criteria

- В settings можно изменить display currency.
- Dashboard умеет запрашивать и отображать отчёты в target currency.
- На кошельках виден общий converted total без потери native balances.
