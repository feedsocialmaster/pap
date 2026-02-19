-- CreateEnum
CREATE TYPE "GatewayProvider" AS ENUM ('MERCADOPAGO', 'TRANSFERENCIA', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'PAYPAL', 'STRIPE', 'OTRO');

-- CreateEnum
CREATE TYPE "GatewayMode" AS ENUM ('SANDBOX', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "RuleScope" AS ENUM ('PRODUCT', 'CATEGORY', 'GLOBAL');

-- CreateEnum
CREATE TYPE "RuleAction" AS ENUM ('CHARGE', 'DISCOUNT');

-- CreateEnum
CREATE TYPE "GatewayPaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "PaymentGateway" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "GatewayProvider" NOT NULL,
    "mode" "GatewayMode" NOT NULL DEFAULT 'SANDBOX',
    "configEncrypted" TEXT NOT NULL,
    "webhookUrl" TEXT,
    "feesFixed" INTEGER NOT NULL DEFAULT 0,
    "feesPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentGateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatewayRule" (
    "id" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "scopeType" "RuleScope" NOT NULL,
    "scopeId" TEXT,
    "action" "RuleAction" NOT NULL,
    "amount" INTEGER,
    "percent" DOUBLE PRECISION,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatewayRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatewayPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "externalId" TEXT,
    "externalReference" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "status" "GatewayPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "errorMessage" TEXT,
    "checkoutUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatewayPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatewayLog" (
    "id" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "request" JSONB,
    "response" JSONB,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "executedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GatewayLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentGateway_active_idx" ON "PaymentGateway"("active");

-- CreateIndex
CREATE INDEX "PaymentGateway_provider_idx" ON "PaymentGateway"("provider");

-- CreateIndex
CREATE INDEX "PaymentGateway_createdBy_idx" ON "PaymentGateway"("createdBy");

-- CreateIndex
CREATE INDEX "GatewayRule_gatewayId_idx" ON "GatewayRule"("gatewayId");

-- CreateIndex
CREATE INDEX "GatewayRule_scopeType_idx" ON "GatewayRule"("scopeType");

-- CreateIndex
CREATE INDEX "GatewayRule_scopeId_idx" ON "GatewayRule"("scopeId");

-- CreateIndex
CREATE INDEX "GatewayRule_active_idx" ON "GatewayRule"("active");

-- CreateIndex
CREATE INDEX "GatewayPayment_orderId_idx" ON "GatewayPayment"("orderId");

-- CreateIndex
CREATE INDEX "GatewayPayment_gatewayId_idx" ON "GatewayPayment"("gatewayId");

-- CreateIndex
CREATE INDEX "GatewayPayment_externalId_idx" ON "GatewayPayment"("externalId");

-- CreateIndex
CREATE INDEX "GatewayPayment_status_idx" ON "GatewayPayment"("status");

-- CreateIndex
CREATE INDEX "GatewayLog_gatewayId_idx" ON "GatewayLog"("gatewayId");

-- CreateIndex
CREATE INDEX "GatewayLog_createdAt_idx" ON "GatewayLog"("createdAt");

-- CreateIndex
CREATE INDEX "GatewayLog_success_idx" ON "GatewayLog"("success");

-- AddForeignKey
ALTER TABLE "GatewayRule" ADD CONSTRAINT "GatewayRule_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "PaymentGateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatewayPayment" ADD CONSTRAINT "GatewayPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatewayPayment" ADD CONSTRAINT "GatewayPayment_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "PaymentGateway"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatewayLog" ADD CONSTRAINT "GatewayLog_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "PaymentGateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;
