# Task 03: snapshot-поля при создании транзакций

## Цель

Научить `createTransaction` сохранять historical snapshot стоимости записи в опорной валюте системы.

## Зависимости

- [01-schema-and-migrations.md](./01-schema-and-migrations.md)
- [02-exchange-rate-service.md](./02-exchange-rate-service.md)

## Область изменений

- `packages/service/src/operations/transactions.ts`

## Новые правила

### Income / Expense

- Если валюта записи уже `USD`, snapshot можно заполнить без внешнего API:
  - `snapshot_currency_id = USD`
  - `snapshot_amount = amount`
  - `snapshot_rate = 1`
- Если валюта не `USD`, до открытия `db.transaction(...)` нужно получить rate через FX service.
- После этого в `transaction_entries` нужно сохранить:
  - `amount`
  - `snapshot_currency_id`
  - `snapshot_amount`
  - `snapshot_rate`

### Transfer

- Для cross-currency transfer курс пары `from -> to` вычисляется из пользовательских `amount` и `toAmount`.
- Этот pair rate не заменяет snapshot в `USD`, а дополняет его как источник истины для самой transfer-пары.
- Для каждой из двух entries нужно попытаться заполнить `snapshot_*` в `USD`.
- Если transfer mono-currency, snapshot считается так же, как для обычных entries.

## Важное ограничение

Внешние вызовы провайдера нельзя делать внутри `db.transaction(...)`.

Правильный порядок:

1. Разрешить валюты.
2. Получить нужные rates.
3. Открыть SQL transaction.
4. Создать `transactions` и `transaction_entries` с уже готовыми snapshot-данными.

## Контракт ошибок

- Ошибки разрешения кошелька и валют остаются в текущем стиле.
- Ошибка получения snapshot-rate должна возвращаться как typed error, а не throw.
- Для `income` и `expense` отсутствие нужного rate блокирует запись.

## Acceptance Criteria

- Новые `income` и `expense` в не-`USD` валюте получают `snapshot_*`.
- `transfer` создаёт две записи и не теряет snapshot для обеих сторон.
- В write-path нет HTTP внутри SQL transaction.
- Сигнатура `createTransaction` остаётся совместимой для API и CLI.
