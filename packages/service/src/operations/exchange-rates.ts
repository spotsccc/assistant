import Coingecko from "@coingecko/coingecko-typescript";
import { db } from "..";
import { FetchError, NotFoundError, ParsingError } from "./errors";

const geckoClient = new Coingecko({
  proAPIKey: process.env.GECKO_API_KEY,
  environment: "demo",
});

export async function getLiveExchangeRate({
  fromCurrencyCode,
  toCurrencyCode,
}: {
  fromCurrencyCode: string;
  toCurrencyCode: string;
}) {
  const fromCurrency = await db.query.currencies.findFirst({
    where: {
      code: fromCurrencyCode,
    },
  });
  if (!fromCurrency) {
    return new NotFoundError({
      entity: "Currency",
      id: fromCurrencyCode,
    });
  }
  const toCurrency = await db.query.currencies.findFirst({
    where: {
      code: toCurrencyCode,
    },
  });
  if (!toCurrency) {
    return new NotFoundError({
      entity: "Currency",
      id: toCurrencyCode,
    });
  }

  if (fromCurrency.type === "fiat" && toCurrency.type === "fiat") {
    const fromRate = await fetchFiatExchangeRate(fromCurrencyCode);
    if (fromRate instanceof Error) {
      return fromRate;
    }
    const toRate = await fetchFiatExchangeRate(toCurrencyCode);
    if (toRate instanceof Error) {
      return toRate;
    }
    return fromRate / toRate;
  }

  if (fromCurrency.type === "fiat" && toCurrency.type === "crypto") {
    const fromRate = await fetchFiatExchangeRate(fromCurrencyCode);
    if (fromRate instanceof Error) {
      return fromRate;
    }
    const toRate = await fetchCryptoExchangeRate(toCurrencyCode);
    if (toRate instanceof Error) {
      return toRate;
    }
    return fromRate / toRate;
  }

  if (fromCurrency.type === "crypto" && toCurrency.type === "fiat") {
    const fromRate = await fetchCryptoExchangeRate(fromCurrencyCode);
    if (fromRate instanceof Error) {
      return fromRate;
    }
    const toRate = await fetchFiatExchangeRate(toCurrencyCode);
    if (toRate instanceof Error) {
      return toRate;
    }
    return fromRate / toRate;
  }

  const fromRate = await fetchCryptoExchangeRate(fromCurrencyCode);
  if (fromRate instanceof Error) {
    return fromRate;
  }
  const toRate = await fetchCryptoExchangeRate(toCurrencyCode);
  if (toRate instanceof Error) {
    return toRate;
  }
  return fromRate / toRate;
}

export async function getExchangeRateToBase(currencyCode: string) {
  const currency = await db.query.currencies.findFirst({
    where: {
      code: currencyCode,
    },
  });
  if (!currency) {
    return new NotFoundError({
      entity: "Currency",
      id: currencyCode,
    });
  }
  if (currency.type === "fiat") {
    return fetchFiatExchangeRate(currencyCode);
  }
  return fetchCryptoExchangeRate(currencyCode);
}

export async function fetchFiatExchangeRate(currencyCode: string) {
  const res = await fetch(
    `https://openexchangerates.org/api/latest.json?app_id=${process.env.OPEN_EXCHANGE_RATES_APP_ID}&symbols=${currencyCode}&prettyprint=false&show_alternative=false`,
  ).catch((e) => new FetchError({ cause: e }));
  if (res instanceof FetchError) {
    return res;
  }
  const body = await res.json().catch((e) => new ParsingError({ cause: e }));
  if (body instanceof ParsingError) {
    return body;
  }
  return (1 / body.rates[currencyCode]) as number;
}

export async function fetchCryptoExchangeRate(currencyCode: string) {
  const rate = await geckoClient.simple.price
    .get({
      vs_currencies: "usd",
      ids: currencyCode,
    })
    .catch((e) => new FetchError({ cause: e }));
  if (rate instanceof FetchError) {
    return rate;
  }
  return rate.usd! as number;
}
