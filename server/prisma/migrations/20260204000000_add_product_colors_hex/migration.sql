-- Migration: Add product colors as hex array
-- Description: Converts the colors field to store hex color codes as JSON array

-- The field already exists as Json? in the schema, so we just need to ensure
-- existing products have a proper default value

-- Update existing products with null colors to have an empty array
UPDATE "Product" SET "colores" = '[]'::jsonb WHERE "colores" IS NULL;

-- Add comment to document the expected format
COMMENT ON COLUMN "Product"."colores" IS 'Array of hex color codes in format ["#RRGGBB", "#RRGGBB", ...]';
