-- Migration: Remove VIP-related columns from User table
-- Date: 2026-02-13
-- Description: Drops nivelVIP, puntosVIP columns and NivelVIP enum type

-- Step 1: Remove columns from User table
ALTER TABLE "User" DROP COLUMN IF EXISTS "nivelVIP";
ALTER TABLE "User" DROP COLUMN IF EXISTS "puntosVIP";

-- Step 2: Remove the NivelVIP enum type
DROP TYPE IF EXISTS "NivelVIP";

-- Verification query (optional, run to confirm):
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'User';
