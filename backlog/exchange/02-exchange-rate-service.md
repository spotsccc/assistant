# Task 02: сервис курсов валют

## Цель

Создать единый service-layer API для live и historical FX rates с кэшем в PostgreSQL и с единым контрактом ошибок.

## Зависимости

- [01-schema-and-migrations.md](./01-schema-and-migrations.md)

## Новая операция

Добавить `packages/service/src/operations/exchange-rates.ts`.

Минимальный API:

```ts
getLiveExchangeRate(input: {
  fromCurrencyCode: string;
  toCurrencyCode: string;
})

getHistoricalExchangeRate(input: {
  fromCurrencyCode: string;
  toCurrencyCode: string;
  effectiveAt: Date;
})

convertAmount(input: {
  amount: string;
  fromCurrencyCode: string;
  toCurrencyCode: string;
  effectiveAt?: Date;
})
```

Все операции должны возвращать `Error | T` в стиле `errore`.

## Обязанности сервиса

- Выбирать провайдера на основе `currencies.kind`.
- Сначала читать подходящий курс из `exchange_rates`.
- Если кэша нет, запрашивать провайдера и сохранять курс в БД.
- Поддерживать инверсию пары.
  Пример: если нужен `ARS -> USD`, а в кэше есть `USD -> ARS`, сервис должен уметь вернуть `1 / rate`.
- Нормализовать ответ в единый внутренний формат.

## Ошибки

Добавить отдельные typed errors, например:

- `ExchangeRateNotFoundError`
- `RateProviderError`
- `UnsupportedCurrencyPairError`
- `InvalidRateError`

## Границы ответственности

- Сервис не должен знать о UI.
- Сервис не должен открывать SQL transaction вокруг внешнего HTTP-вызова.
- Сервис не должен определять тип валюты по строковым хардкодам.

## Provider strategy для v1

- `fiat` -> fiat-provider
- `crypto` -> crypto-provider

Если в паре смешаны `fiat` и `crypto`, стратегия выбора должна быть явно описана в коде.

## Acceptance Criteria

- Сервис умеет вернуть live rate из кэша или провайдера.
- Сервис умеет вернуть historical rate из кэша или провайдера.
- Сервис умеет конвертировать строковую сумму и возвращать rate + converted amount.
- Ошибки провайдера оборачиваются в typed domain errors.
- Новый модуль экспортируется через `@repo/service/operations`.
