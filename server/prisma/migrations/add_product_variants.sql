-- Migration: Add product_variants table and stock_total field
-- Description: Implements per-color variant stock management
-- Author: GitHub Copilot
-- Date: 2026-02-06

BEGIN;

-- 1. Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  color_name VARCHAR(100) NOT NULL,
  color_code VARCHAR(7) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  sku VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT fk_product_variant_product 
    FOREIGN KEY (product_id) 
    REFERENCES "Product"(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT unique_product_color 
    UNIQUE (product_id, color_code),
    
  CONSTRAINT check_stock_non_negative
    CHECK (stock >= 0)
);

-- 2. Create indexes for performance
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_stock ON product_variants(stock);

-- 3. Add stock_total column to Product table
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS stock_total INTEGER DEFAULT 0;

-- 4. Migrate existing stock data to variants
-- For each product with colores, create a variant per color
-- If no colores, create a default variant with color_name='Default'

DO $$
DECLARE
  product_record RECORD;
  color_item TEXT;
  color_array JSONB;
  variant_id TEXT;
  stock_per_color INTEGER;
BEGIN
  FOR product_record IN 
    SELECT id, stock, colores 
    FROM "Product" 
    WHERE stock > 0 OR colores IS NOT NULL
  LOOP
    -- Get colors array
    color_array := product_record.colores;
    
    -- If product has colors defined
    IF color_array IS NOT NULL AND jsonb_array_length(color_array) > 0 THEN
      -- Distribute stock equally among colors
      stock_per_color := FLOOR(product_record.stock::NUMERIC / jsonb_array_length(color_array));
      
      -- Create variant for each color
      FOR color_item IN 
        SELECT jsonb_array_elements_text(color_array)
      LOOP
        variant_id := gen_random_uuid()::TEXT || substr(md5(random()::text), 1, 16);
        
        INSERT INTO product_variants (
          id, product_id, color_name, color_code, stock, created_at, updated_at
        ) VALUES (
          variant_id,
          product_record.id,
          'Color ' || color_item, -- Default name, can be updated later
          color_item,
          stock_per_color,
          now(),
          now()
        ) ON CONFLICT (product_id, color_code) DO NOTHING;
      END LOOP;
      
    ELSE
      -- Product has no colors defined, create default variant
      variant_id := gen_random_uuid()::TEXT || substr(md5(random()::text), 1, 16);
      
      INSERT INTO product_variants (
        id, product_id, color_name, color_code, stock, created_at, updated_at
      ) VALUES (
        variant_id,
        product_record.id,
        'Default',
        '#000000', -- Default black
        product_record.stock,
        now(),
        now()
      ) ON CONFLICT (product_id, color_code) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- 5. Calculate and update stock_total for all products
UPDATE "Product" p
SET stock_total = COALESCE(
  (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id),
  0
);

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully: product_variants table created and data migrated';
END $$;
