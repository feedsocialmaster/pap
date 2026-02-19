-- AlterTable: Cambiar ID de CMSBlogPost de String a Int
-- Nota: Esta migración eliminará y recreará la tabla CMSBlogPost
-- debido al cambio de tipo de la clave primaria

-- Crear tabla temporal con nuevo esquema
CREATE TABLE "CMSBlogPost_new" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "tituloSeo" TEXT,
    "slug" TEXT NOT NULL,
    "slugSeo" TEXT,
    "descripcion" TEXT NOT NULL,
    "descripcionSeo" TEXT,
    "palabrasClave" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "autor" TEXT NOT NULL,
    "miniatura" TEXT,
    "cuerpo" TEXT NOT NULL,
    "estado" "EstadoBlogPost" NOT NULL DEFAULT 'BORRADOR',
    "programadoPara" TIMESTAMP(3),
    "publicadoEn" TIMESTAMP(3),
    "vistas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSBlogPost_new_pkey" PRIMARY KEY ("id")
);

-- Copiar datos de la tabla antigua a la nueva (si existen datos)
-- INSERT INTO "CMSBlogPost_new" (
--   "titulo", "tituloSeo", "slug", "slugSeo", "descripcion", "descripcionSeo",
--   "palabrasClave", "autor", "miniatura", "cuerpo", "estado",
--   "programadoPara", "publicadoEn", "vistas", "createdAt", "updatedAt"
-- )
-- SELECT 
--   "titulo", "tituloSeo", "slug", "slugSeo", "descripcion", "descripcionSeo",
--   "palabrasClave", "autor", "miniatura", "cuerpo", "estado",
--   "programadoPara", "publicadoEn", "vistas", "createdAt", "updatedAt"
-- FROM "CMSBlogPost";

-- Eliminar tabla antigua
DROP TABLE IF EXISTS "CMSBlogPost";

-- Renombrar tabla nueva
ALTER TABLE "CMSBlogPost_new" RENAME TO "CMSBlogPost";

-- CreateIndex
CREATE UNIQUE INDEX "CMSBlogPost_slug_key" ON "CMSBlogPost"("slug");

-- CreateIndex
CREATE INDEX "CMSBlogPost_slug_idx" ON "CMSBlogPost"("slug");

-- CreateIndex
CREATE INDEX "CMSBlogPost_estado_idx" ON "CMSBlogPost"("estado");

-- CreateIndex
CREATE INDEX "CMSBlogPost_publicadoEn_idx" ON "CMSBlogPost"("publicadoEn");
