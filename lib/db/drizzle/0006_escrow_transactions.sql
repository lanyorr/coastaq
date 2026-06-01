-- Migration 0006: Escrow transaction ledger
-- Records every deposit, release, refund, and platform fee event per order

CREATE TABLE IF NOT EXISTS "escrow_transactions" (
  "id" text PRIMARY KEY NOT NULL,
  "order_id" text NOT NULL,
  "buyer_id" text NOT NULL,
  "seller_id" text NOT NULL,
  "type" text NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "status" text NOT NULL DEFAULT 'completed',
  "note" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_order_id_orders_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_buyer_id_users_id_fk"
  FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_seller_id_users_id_fk"
  FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_escrow_transactions_order_id" ON "escrow_transactions" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_escrow_transactions_buyer_id" ON "escrow_transactions" ("buyer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_escrow_transactions_seller_id" ON "escrow_transactions" ("seller_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_escrow_transactions_type" ON "escrow_transactions" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_escrow_transactions_created_at" ON "escrow_transactions" ("created_at" DESC);
