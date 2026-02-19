-- CreateEnum
CREATE TYPE "EstadoEntrega" AS ENUM ('PREPARANDO', 'EN_CAMINO', 'ENTREGADO', 'VISITADO_NO_ENTREGADO', 'RETIRO_EN_LOCAL', 'CANCELADO');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "confirmoRecepcion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estadoEntrega" "EstadoEntrega" NOT NULL DEFAULT 'PREPARANDO',
ADD COLUMN     "fechaConfirmacion" TIMESTAMP(3),
ADD COLUMN     "fechaUltimoIntento" TIMESTAMP(3),
ADD COLUMN     "intentosEntrega" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "motivoNoEntrega" TEXT,
ADD COLUMN     "notasInternas" TEXT;

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "estadoAnterior" "EstadoEntrega",
    "estadoNuevo" "EstadoEntrega" NOT NULL,
    "cambiadoPor" TEXT NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_createdAt_idx" ON "OrderStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX "Order_usuarioId_idx" ON "Order"("usuarioId");

-- CreateIndex
CREATE INDEX "Order_estado_idx" ON "Order"("estado");

-- CreateIndex
CREATE INDEX "Order_estadoEntrega_idx" ON "Order"("estadoEntrega");

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
