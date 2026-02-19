-- Rollback Migration: Remove order fulfillment and user verification fields
-- Date: 2026-02-06

-- Remove pickup location table
DROP TABLE IF EXISTS "PickupLocation";

-- Remove indexes
DROP INDEX IF EXISTS "Order_fulfillment_type_idx";
DROP INDEX IF EXISTS "User_verification_token_idx";
DROP INDEX IF EXISTS "User_email_verified_idx";

-- Remove columns from Order table
ALTER TABLE "Order"
  DROP COLUMN IF EXISTS "fulfillment_type",
  DROP COLUMN IF EXISTS "pickup_location_id",
  DROP COLUMN IF EXISTS "is_collected",
  DROP COLUMN IF EXISTS "collected_at",
  DROP COLUMN IF EXISTS "payment_method_detail";

-- Remove columns from User table
ALTER TABLE "User"
  DROP COLUMN IF EXISTS "email_verified",
  DROP COLUMN IF EXISTS "verification_token",
  DROP COLUMN IF EXISTS "verification_token_expires";
