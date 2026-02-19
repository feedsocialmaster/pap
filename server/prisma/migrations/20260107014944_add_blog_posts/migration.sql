-- CreateEnum
CREATE TYPE "EstadoBlogPost" AS ENUM ('BORRADOR', 'PROGRAMADO', 'PUBLICADO', 'ARCHIVADO');

-- CreateTable
CREATE TABLE "CMSBlogPost" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "CMSBlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CMSBlogPost_slug_key" ON "CMSBlogPost"("slug");

-- CreateIndex
CREATE INDEX "CMSBlogPost_slug_idx" ON "CMSBlogPost"("slug");

-- CreateIndex
CREATE INDEX "CMSBlogPost_estado_idx" ON "CMSBlogPost"("estado");

-- CreateIndex
CREATE INDEX "CMSBlogPost_publicadoEn_idx" ON "CMSBlogPost"("publicadoEn");
