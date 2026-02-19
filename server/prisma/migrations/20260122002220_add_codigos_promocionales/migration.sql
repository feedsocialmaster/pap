-- CreateEnum for CMSCodigoPromocional (used in CMS) - Only if doesn't exist
DO $$ BEGIN
    CREATE TYPE "TipoDescuento" AS ENUM ('PORCENTAJE', 'MONTO_FIJO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable CMSCodigoPromocional (cupones - SÍ se usa) - Only if doesn't exist
CREATE TABLE IF NOT EXISTS "CMSCodigoPromocional" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descuento" INTEGER NOT NULL,
    "tipoDescuento" "TipoDescuento" NOT NULL DEFAULT 'PORCENTAJE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "usosMaximos" INTEGER,
    "usosActuales" INTEGER NOT NULL DEFAULT 0,
    "usuariosPermitidos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSCodigoPromocional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex - Only if don't exist
CREATE UNIQUE INDEX IF NOT EXISTS "CMSCodigoPromocional_codigo_key" ON "CMSCodigoPromocional"("codigo");

-- CreateIndex - Only if don't exist
CREATE INDEX IF NOT EXISTS "CMSCodigoPromocional_codigo_idx" ON "CMSCodigoPromocional"("codigo");

-- CreateIndex - Only if don't exist
CREATE INDEX IF NOT EXISTS "CMSCodigoPromocional_activo_idx" ON "CMSCodigoPromocional"("activo");

-- AlterTable User - Add user status fields (used for suspensions) - Only if don't exist
DO $$ BEGIN
    ALTER TABLE "User" ADD COLUMN "activo" BOOLEAN NOT NULL DEFAULT true;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "User" ADD COLUMN "fechaSuspension" TIMESTAMP(3);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "User" ADD COLUMN "motivoSuspension" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "User" ADD COLUMN "suspendido" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- CreateIndex for User status - Only if don't exist
CREATE INDEX IF NOT EXISTS "User_activo_idx" ON "User"("activo");
CREATE INDEX IF NOT EXISTS "User_suspendido_idx" ON "User"("suspendido");
