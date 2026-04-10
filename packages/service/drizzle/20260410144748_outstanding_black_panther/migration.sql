CREATE TYPE "currency_type" AS ENUM('fiat', 'crypto');--> statement-breakpoint
ALTER TABLE "currencies" ADD COLUMN "type" "currency_type";