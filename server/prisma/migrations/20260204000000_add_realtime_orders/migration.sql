-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CMSOrderStatus') THEN
    CREATE TYPE "CMSOrderStatus" AS ENUM ('PENDING', 'ACCEPTED', 'NOT_DELIVERED', 'DELIVERED');
  END IF;
END $$;

-- AlterTable Order - Add new columns for realtime order management
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "deliveryReason" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "cmsStatus" "CMSOrderStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable OrderAudit
CREATE TABLE IF NOT EXISTS "OrderAudit" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedByEmail" TEXT,
    "action" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "deliveryReason" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_cmsStatus_idx" ON "Order"("cmsStatus");
CREATE INDEX IF NOT EXISTS "Order_fecha_idx" ON "Order"("fecha");
CREATE INDEX IF NOT EXISTS "OrderAudit_orderId_idx" ON "OrderAudit"("orderId");
CREATE INDEX IF NOT EXISTS "OrderAudit_createdAt_idx" ON "OrderAudit"("createdAt");
CREATE INDEX IF NOT EXISTS "OrderAudit_changedBy_idx" ON "OrderAudit"("changedBy");
CREATE INDEX IF NOT EXISTS "OrderAudit_changedByEmail_idx" ON "OrderAudit"("changedByEmail");
CREATE INDEX IF NOT EXISTS "OrderAudit_action_idx" ON "OrderAudit"("action");

-- AddForeignKey
ALTER TABLE "OrderAudit" ADD CONSTRAINT "OrderAudit_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
