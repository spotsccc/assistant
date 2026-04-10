# Провайдеры Exchange API

## Контекст

Этот документ фиксирует выбор внешних провайдеров курсов валют для exchange/fx слоя в проекте.

Исходные требования:

- в проекте есть и `fiat`, и `crypto` валюты;
- нужны `live` и `historical` курсы;
- текущий набор валют проекта включает как минимум `ARS`, `RUB`, `USD`, `ETH`, `USDT`;
- snapshot-валюта системы в `v1` фиксирована как `USD`;
- mixed-пары `fiat <-> crypto` должны поддерживаться без усложнения service-layer.

Дата проверки тарифов и документации: `2026-04-09`.

## Критерии выбора

- Нужны `live` и `historical` курсы, а не только daily reference rates.
- Покрытие должно включать хотя бы текущие валюты проекта: `ARS`, `RUB`, `USD`, `ETH`, `USDT`.
- Провайдер должен позволять безопасно строить snapshot в `USD` и display-конвертацию в обе стороны.
- Для backfill и historical reports нужен предсказуемый API по дате или диапазону дат.

## Рекомендуемый стек

- `fiat-provider` для free/cheap `v1`: [Frankfurter](https://frankfurter.dev/docs/)
- `fiat-provider` для paid intraday `v1`: [currencyapi](https://currencyapi.com/docs) или [Open Exchange Rates](https://openexchangerates.org/about)
- `crypto-provider`: [CoinGecko](https://docs.coingecko.com/reference/introduction)
- mixed `fiat <-> crypto` пары: конвертация через `USD`

Для текущей архитектуры разумно иметь два профиля:

- `budget/default`: `Frankfurter + CoinGecko`
- `paid/live`: `currencyapi + CoinGecko` или `Open Exchange Rates + CoinGecko`

У вас уже зафиксирована snapshot-валюта `USD`, а значит mixed-пары не требуют отдельного market-data движка, если обе стороны умеют надёжно давать курс к `USD`.

## 1. Fiat provider для free/cheap v1: Frankfurter

Почему подходит:

- У Frankfurter нет API keys и нет месячных квот: [docs](https://frankfurter.dev/docs/), [v2 docs](https://frankfurter.dev/).
- Есть `latest`, historical rates и time series.
- Сервис open-source и self-hostable через Docker, что хорошо сочетается с personal-project сценарием.
- Для `USD`-centric mixed strategy он подходит хорошо: можно брать `ARS -> USD` и `RUB -> USD` как daily reference rates без отдельной платной подписки.

Ограничения:

- Это не intraday/live FX provider. Frankfurter публикует daily reference rates, а не real-time поток.
- Если нужен именно свежий текущий `fiat` rate в течение дня, Frankfurter будет уступать paid-провайдерам.
- Для snapshot на write-path это приемлемо только потому, что в текущем бэклоге уже разрешён fallback к ближайшему доступному daily rate.

Практический вывод:

- Если цель `v1`: personal finance, snapshots в `USD`, отчёты и backfill без лишних затрат, то `Frankfurter` лучше `currencyapi Free`.
- Даже при хорошем кэше `300 requests/month` у `currencyapi Free` слишком мало как запас на UI refresh, cache misses и backfill.

## 2. Fiat provider для paid intraday v1: currencyapi

Почему всё ещё стоит рассматривать:

- Есть отдельные endpoints для [latest](https://currencyapi.com/docs/latest), [historical](https://currencyapi.com/docs/historical), [convert](https://currencyapi.com/docs/convert); у `Medium` есть ещё и [range](https://currencyapi.com/docs/range).
- В списке валют есть `ARS` и `RUB`: [currency list](https://currencyapi.com/docs/currency-list).
- По [pricing](https://currencyapi.com/pricing/) `Small` сейчас стоит `$9.99/month` и даёт `15,000 requests/month`, а `Medium` даёт `600,000 requests/month` и `60 sec` updates.

Почему не стоит брать именно free-план как дефолт:

- По состоянию на `2026-04-09` free-план даёт только `300 requests/month`: [pricing](https://currencyapi.com/pricing/), [rate limits](https://currencyapi.com/docs/rate-limit).
- Это слишком жёсткий лимит даже для небольшого приложения, если есть live read-path, retries, ручные refresh и historical cache misses.

Практический вывод:

- `currencyapi` имеет смысл только как платный `fiat-provider`, если нужен intraday/live fiat и вы готовы платить.
- Если платить не хочется, лучше сразу использовать `Frankfurter`.

## 3. Основной crypto provider: CoinGecko

Почему подходит:

- CoinGecko заявляет широкое покрытие crypto-активов и токенов: [introduction](https://docs.coingecko.com/reference/introduction).
- Для live-цен достаточно [simple price](https://docs.coingecko.com/reference/simple-price).
- Для history по дате есть [coins/{id}/history](https://docs.coingecko.com/reference/coins-id-history).
- Для диапазонов и backfill есть [market chart range](https://docs.coingecko.com/reference/coins-id-market-chart-range).
- В списке поддерживаемых quote-валют есть `usd`, `ars` и `rub`: [supported vs currencies](https://docs.coingecko.com/reference/simple-supported-currencies).
- Для текущих crypto-валют проекта это подходящий источник: `ETH` и `USDT` у CoinGecko покрываются без необходимости заводить отдельный stablecoin provider.

Ограничения, которые надо учитывать:

- У Demo-плана исторические данные ограничены последними `365` днями: [history docs](https://docs.coingecko.com/v3.0.1/reference/coins-id-history).
- По [pricing](https://www.coingecko.com/api/pricing) Demo даёт `10k` credits/month и `30 req/min`; Basic начинается от `$35/month` и даёт `100k` credits/month, а Analyst добавляет глубокую историю и real-time tier.
- Для старого backfill, если в базе уже есть записи заметно старше года, почти наверняка понадобится платный план.

## 4. Стратегия для mixed-пар

Для `fiat -> crypto` и `crypto -> fiat` в `v1` не нужен отдельный третий провайдер:

1. Всё приводится к `USD`, потому что snapshot-валюта системы уже фиксирована как `USD`.
2. `fiat -> USD` и `USD -> fiat` идут через выбранный `fiat-provider` (`Frankfurter`, `currencyapi` или `Open Exchange Rates`).
3. `crypto -> USD` и `USD -> crypto` идут через `CoinGecko` напрямую или через инверсию курса.
4. Пары вроде `ARS -> ETH` считаются как `ARS -> USD -> ETH`.

Это упрощает service-layer API и делает поведение mixed-пар явным.

## 5. Хорошие альтернативы

### Open Exchange Rates

- Подходит как сильная альтернатива или backup для `fiat`: есть [live + historical](https://openexchangerates.org/about), [200+ currencies](https://docs.openexchangerates.org/reference/supported-currencies) и понятный [pricing](https://openexchangerates.org/signup).
- У free-плана сейчас `1,000 requests/month` и hourly updates, у `Developer` плана `$12/month` и `10,000 requests/month`: [signup](https://openexchangerates.org/signup), [free plan](https://openexchangerates.org/signup/free).
- Для `crypto` хуже подходит: digital-валюты у них идут через отдельный механизм [alternative rates](https://docs.openexchangerates.org/reference/alternative-currencies), а не через основной happy-path для FX.
- Вывод: хороший `fiat-only` вариант, особенно если нужен hourly feed и хочется лимит выше, чем у `currencyapi Free`.

### CoinAPI

- Это сильный enterprise-вариант, если захочется один контракт на всё: [150+ fiat и 19,000+ digital assets](https://www.coinapi.io/products/exchange-rates-api), real-time/historical и [99.9% SLA](https://www.coinapi.io/).
- Главный минус для текущего проекта: цена. По [pricing](https://www.coinapi.io/products/exchange-rates-api/pricing) Growth-план начинается с `$249/month`.
- Вывод: технически очень хороший вариант, но для personal-finance продукта это обычно overkill до тех пор, пока не появятся строгие SLA или высокие объёмы.

### Frankfurter как backup

- Очень хороший бесплатный backup для `fiat`: open-source, self-hostable, historical rates и без API key: [docs](https://frankfurter.dev/docs/).
- Но это daily feed, а не полноценный live FX provider.
- Вывод: полезен как fallback для daily backfill или self-hosted резерв, но не как основной источник `live` курса.

## Decision for v1

- Если нужен `free/cheap` профиль, берите `Frankfurter` для `fiat` и `CoinGecko Demo/paid` для `crypto`.
- Если нужен `paid/live` профиль, берите `currencyapi Small` или `Open Exchange Rates Developer` для `fiat` и `CoinGecko` для `crypto`.
- Mixed-пары: только через `USD`
- Резервный `fiat` provider: `Open Exchange Rates` или `Frankfurter`
- Enterprise single-provider option: `CoinAPI`

Для personal-finance `v1` я бы выбирал `Frankfurter + CoinGecko`, если не нужен intraday fiat. Если нужен более свежий `fiat` rate в течение дня, тогда уже имеет смысл платить за `currencyapi` или `Open Exchange Rates`.

Тарифы, лимиты и глубину исторических данных стоит перепроверить перед реальной интеграцией: этот shortlist собран по официальным страницам провайдеров на `2026-04-09`.
