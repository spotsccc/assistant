import * as errore from "errore";

export class NotFoundError extends errore.createTaggedError({
  name: "NotFoundError",
  message: "$entity $id not found",
}) {}

export class InsufficientFundsError extends errore.createTaggedError({
  name: "InsufficientFundsError",
  message:
    "Insufficient funds in wallet $walletId: available $available, required $required",
}) {}

export class DbError extends errore.createTaggedError({
  name: "DbError",
  message: "Database operation failed: $reason",
}) {}
