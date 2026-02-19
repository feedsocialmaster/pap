-- CreateEnum
CREATE TYPE "TipoDescuentoPromo" AS ENUM ('PORCENTAJE', 'MONTO_FIJO', 'DOS_POR_UNO');

-- CreateTable
CREATE TABLE "CMSPromocion" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imagenUrl" TEXT,
    "tipoDescuento" "TipoDescuentoPromo" NOT NULL,
    "valorDescuento" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "compraMinima" INTEGER,
    "productosAplicables" TEXT[],
    "tiposCalzadoAplicables" TEXT[],
    "soloClubVIP" BOOLEAN NOT NULL DEFAULT false,
    "nivelesVIPAplicables" TEXT[],
    "usosMaximos" INTEGER,
    "usosActuales" INTEGER NOT NULL DEFAULT 0,
    "usosPorUsuario" INTEGER,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "colorFondo" TEXT,
    "colorTexto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "CMSPromocion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSUsoPromocion" (
    "id" TEXT NOT NULL,
    "promocionId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "descuentoAplicado" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CMSUsoPromocion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CMSPromocion_slug_key" ON "CMSPromocion"("slug");

-- CreateIndex
CREATE INDEX "CMSPromocion_activo_idx" ON "CMSPromocion"("activo");

-- CreateIndex
CREATE INDEX "CMSPromocion_fechaInicio_idx" ON "CMSPromocion"("fechaInicio");

-- CreateIndex
CREATE INDEX "CMSPromocion_fechaFin_idx" ON "CMSPromocion"("fechaFin");

-- CreateIndex
CREATE INDEX "CMSPromocion_destacado_idx" ON "CMSPromocion"("destacado");

-- CreateIndex
CREATE INDEX "CMSUsoPromocion_promocionId_idx" ON "CMSUsoPromocion"("promocionId");

-- CreateIndex
CREATE INDEX "CMSUsoPromocion_usuarioId_idx" ON "CMSUsoPromocion"("usuarioId");

-- CreateIndex
CREATE INDEX "CMSUsoPromocion_ordenId_idx" ON "CMSUsoPromocion"("ordenId");
