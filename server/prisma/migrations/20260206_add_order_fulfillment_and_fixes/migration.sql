-- Migration: Add fulfillment type, payment details, and user activation fields
-- Date: 2026-02-06
-- Description: Adds support for pickup option, detailed payment method tracking, and user activation workflow

-- Add fulfillment type and pickup tracking to orders
ALTER TABLE "Order" 
  ADD COLUMN "fulfillment_type" VARCHAR(16) DEFAULT 'shipping',
  ADD COLUMN "pickup_location_id" VARCHAR(255),
  ADD COLUMN "is_collected" BOOLEAN DEFAULT FALSE,
  ADD COLUMN "collected_at" TIMESTAMP,
  ADD COLUMN "payment_method_detail" VARCHAR(64);

-- Add comments for clarity
COMMENT ON COLUMN "Order"."fulfillment_type" IS 'Type of fulfillment: shipping or pickup';
COMMENT ON COLUMN "Order"."pickup_location_id" IS 'Location ID if pickup selected';
COMMENT ON COLUMN "Order"."is_collected" IS 'Whether order has been collected (for pickup orders)';
COMMENT ON COLUMN "Order"."collected_at" IS 'Timestamp when order was collected';
COMMENT ON COLUMN "Order"."payment_method_detail" IS 'Detailed payment method (tarjeta, transferencia, efectivo, etc.)';

-- Add email verification tracking for users
ALTER TABLE "User"
  ADD COLUMN "email_verified" BOOLEAN DEFAULT FALSE,
  ADD COLUMN "verification_token" VARCHAR(255),
  ADD COLUMN "verification_token_expires" TIMESTAMP;

-- Add index for verification lookup
CREATE INDEX IF NOT EXISTS "User_verification_token_idx" ON "User"("verification_token");
CREATE INDEX IF NOT EXISTS "User_email_verified_idx" ON "User"("email_verified");

-- Add index for fulfillment type queries
CREATE INDEX IF NOT EXISTS "Order_fulfillment_type_idx" ON "Order"("fulfillment_type");

-- Create table for pickup locations (if needed in future)
CREATE TABLE IF NOT EXISTS "PickupLocation" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "address" TEXT NOT NULL,
  "city" VARCHAR(255) NOT NULL,
  "province" VARCHAR(255) NOT NULL,
  "postal_code" VARCHAR(20),
  "phone" VARCHAR(50),
  "opening_hours" JSONB,
  "is_active" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE "PickupLocation" IS 'Physical locations where customers can pick up their orders';
