import { db } from "..";

export function getLiveExchangeRate({
  fromCurrencyCode,
}: {
  fromCurrencyCode: string;
  toCurrencyCode: string;
}) {
  db.query.currencies.findFirst({
    where: {
      code: fromCurrencyCode,
    },
  });
}

export function getHistoricalExchangeRate(input: {
  fromCurrencyCode: string;
  toCurrencyCode: string;
  effectiveAt: Date;
}) {}

export function convertAmount(input: {
  amount: string;
  fromCurrencyCode: string;
  toCurrencyCode: string;
  effectiveAt?: Date;
}) {}
