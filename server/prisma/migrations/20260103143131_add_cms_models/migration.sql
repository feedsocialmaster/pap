/*
  Warnings:

  - Added the required column `updatedAt` to the `Promotion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoMensaje" AS ENUM ('INTERNO', 'SOPORTE', 'NOTIFICACION');

-- CreateEnum
CREATE TYPE "TipoRecurso" AS ENUM ('GUIA', 'TUTORIAL', 'DOCUMENTO', 'VIDEO', 'ENLACE');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('INFO', 'PROMOCION', 'ALERTA', 'SISTEMA');

-- CreateEnum
CREATE TYPE "PrioridadNotificacion" AS ENUM ('BAJA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "CategoriaFAQ" AS ENUM ('COMPRAS_PAGOS', 'ENVIOS', 'CAMBIOS_DEVOLUCIONES', 'CLUB_VIP', 'CUENTA', 'GENERAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'GERENTE_COMERCIAL';
ALTER TYPE "Role" ADD VALUE 'ADMIN_CMS';

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_productId_fkey";

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "CMSMessage" (
    "id" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "remitenteId" TEXT NOT NULL,
    "destinatarioId" TEXT,
    "tipo" "TipoMensaje" NOT NULL DEFAULT 'INTERNO',
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CMSMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSEvento" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "imagen" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "ubicacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSRecursoUtil" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoRecurso" NOT NULL,
    "contenido" TEXT NOT NULL,
    "archivo" TEXT,
    "icono" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSRecursoUtil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSNotificacion" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "prioridad" "PrioridadNotificacion" NOT NULL DEFAULT 'NORMAL',
    "destinatarios" TEXT[],
    "programada" TIMESTAMP(3),
    "enviada" BOOLEAN NOT NULL DEFAULT false,
    "fechaEnvio" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CMSNotificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSPromoBancaria" (
    "id" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "beneficio" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSPromoBancaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSSucursal" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "horarios" JSONB NOT NULL,
    "horariosEspeciales" JSONB,
    "mapsUrl" TEXT,
    "coordenadas" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSSucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSFAQ" (
    "id" TEXT NOT NULL,
    "pregunta" TEXT NOT NULL,
    "respuesta" TEXT NOT NULL,
    "categoria" "CategoriaFAQ" NOT NULL,
    "icono" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSFAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSTestimonio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "texto" TEXT NOT NULL,
    "calificacion" INTEGER NOT NULL DEFAULT 5,
    "ubicacion" TEXT,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSTestimonio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSContenidoPagina" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "seo" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSContenidoPagina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSAuditLog" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "cambios" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CMSAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CMSContenidoPagina_slug_key" ON "CMSContenidoPagina"("slug");

-- CreateIndex
CREATE INDEX "CMSAuditLog_usuarioId_idx" ON "CMSAuditLog"("usuarioId");

-- CreateIndex
CREATE INDEX "CMSAuditLog_entidad_idx" ON "CMSAuditLog"("entidad");

-- CreateIndex
CREATE INDEX "CMSAuditLog_createdAt_idx" ON "CMSAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Product_tipoCalzado_idx" ON "Product"("tipoCalzado");

-- CreateIndex
CREATE INDEX "Product_fechaCreacion_idx" ON "Product"("fechaCreacion");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSMessage" ADD CONSTRAINT "CMSMessage_remitenteId_fkey" FOREIGN KEY ("remitenteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSMessage" ADD CONSTRAINT "CMSMessage_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSAuditLog" ADD CONSTRAINT "CMSAuditLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
