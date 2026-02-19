-- CreateTable Category (used in CMS and Product categorization) - Only if doesn't exist
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex - Only if don't exist
DO $$ BEGIN
    CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateIndex - Only if don't exist
CREATE INDEX IF NOT EXISTS "Category_parent_id_idx" ON "Category"("parent_id");

-- CreateIndex - Only if don't exist
CREATE INDEX IF NOT EXISTS "Category_activo_idx" ON "Category"("activo");

-- CreateIndex - Only if don't exist
CREATE INDEX IF NOT EXISTS "Category_slug_idx" ON "Category"("slug");

-- AddForeignKey - Only if doesn't exist
DO $$ BEGIN
    ALTER TABLE "Category" ADD CONSTRAINT "Category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable Product - Add category relationship - Only if doesn't exist
DO $$ BEGIN
    ALTER TABLE "Product" ADD COLUMN "category_id" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- CreateIndex - Only if don't exist
CREATE INDEX IF NOT EXISTS "Product_category_id_idx" ON "Product"("category_id");

-- AddForeignKey - Only if doesn't exist
DO $$ BEGIN
    ALTER TABLE "Product" ADD CONSTRAINT "Product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear categoría por defecto para productos sin categoría - Only if doesn't exist
INSERT INTO "Category" (id, name, slug, description, orden, activo, created_at, updated_at)
SELECT 'default-category', 'Sin Categoría', 'sin-categoria', 'Productos sin categoría asignada', 999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE id = 'default-category');
