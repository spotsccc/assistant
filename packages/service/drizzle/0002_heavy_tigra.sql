ALTER TABLE "transaction_entries" ALTER COLUMN "snapshot_currency_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction_entries" ALTER COLUMN "snapshot_amount" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction_entries" ALTER COLUMN "snapshotRate" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction_entries" ADD COLUMN "snapshot_rate" numeric(36, 18);