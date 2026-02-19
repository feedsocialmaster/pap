-- Rollback Migration: Remove product_variants table
-- Description: Reverts per-color variant stock management
-- WARNING: This will delete all variant data!
-- Author: GitHub Copilot
-- Date: 2026-02-06

BEGIN;

-- 1. Restore stock to Product table from variants (before deletion)
UPDATE "Product" p
SET stock = COALESCE(
  (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id),
  p.stock_total
);

-- 2. Drop stock_total column
ALTER TABLE "Product" 
DROP COLUMN IF EXISTS stock_total;

-- 3. Drop indexes
DROP INDEX IF EXISTS idx_product_variants_product_id;
DROP INDEX IF EXISTS idx_product_variants_stock;

-- 4. Drop product_variants table
DROP TABLE IF EXISTS product_variants;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Rollback completed: product_variants table removed, stock restored';
END $$;
