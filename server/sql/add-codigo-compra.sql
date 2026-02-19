-- AddColumn
ALTER TABLE "Product" ADD COLUMN "codigoCompra" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_codigoCompra_key" ON "Product"("codigoCompra");

-- CreateIndex
CREATE INDEX "Product_codigoCompra_idx" ON "Product"("codigoCompra");
