-- Migration: Add size field to product_variants
-- Date: 2026-02-07
-- Description: Add size (talle) field to support stock management by color AND size combination

-- Step 1: Add size column with a temporary default value
-- (We use 38 as default since it's a common shoe size)
ALTER TABLE "product_variants" 
ADD COLUMN "size" INTEGER NOT NULL DEFAULT 38;

-- Step 2: Drop the old unique constraint (productId + colorCode)
ALTER TABLE "product_variants" 
DROP CONSTRAINT "product_variants_productId_colorCode_key";

-- Step 3: Create new unique constraint (productId + colorCode + size)
ALTER TABLE "product_variants" 
ADD CONSTRAINT "product_variants_productId_colorCode_size_key" 
UNIQUE ("product_id", "color_code", "size");

-- Step 4: Remove default value (new records must specify size explicitly)
ALTER TABLE "product_variants" 
ALTER COLUMN "size" DROP DEFAULT;

-- ============================================================================
-- IMPORTANT: DATA MIGRATION REQUIRED
-- ============================================================================
-- After running this migration, you need to populate the size field for 
-- existing variants. Here are some options:
--
-- Option 1: Delete all existing variants (recommended for dev/staging)
--   DELETE FROM product_variants;
--   
--   Then recreate variants through the CMS with proper color-size combinations.
--
-- Option 2: Generate variants for all sizes (for each existing color variant)
--   This SQL will create variants for common sizes (35-42) for each existing variant:
--
--   WITH existing_variants AS (
--     SELECT DISTINCT product_id, color_name, color_code, sku 
--     FROM product_variants
--   ),
--   sizes AS (
--     SELECT generate_series(35, 42) as size
--   )
--   INSERT INTO product_variants (product_id, color_name, color_code, size, stock, sku, created_at, updated_at)
--   SELECT 
--     ev.product_id,
--     ev.color_name,
--     ev.color_code,
--     s.size,
--     0 as stock,
--     CASE WHEN ev.sku IS NOT NULL 
--       THEN ev.sku || '-' || s.size 
--       ELSE NULL 
--     END as sku,
--     NOW() as created_at,
--     NOW() as updated_at
--   FROM existing_variants ev
--   CROSS JOIN sizes s
--   ON CONFLICT (product_id, color_code, size) DO NOTHING;
--
--   -- Clean up the old variants with default size
--   DELETE FROM product_variants WHERE size = 38;
--
-- Option 3: Manual update through CMS
--   Use the CMS interface to configure stock for each color-size combination
--
-- ============================================================================

-- Step 5: Update stock_total for all products
UPDATE products 
SET stock_total = (
  SELECT COALESCE(SUM(stock), 0) 
  FROM product_variants 
  WHERE product_variants.product_id = products.id
);
