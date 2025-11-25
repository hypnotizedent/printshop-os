-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "colorCode" TEXT,
    "style" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "wholesaleCost" DOUBLE PRECISION NOT NULL,
    "inventoryQty" INTEGER NOT NULL DEFAULT 0,
    "inventoryStatus" TEXT NOT NULL DEFAULT 'out_of_stock',
    "lastSync" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DOUBLE PRECISION,
    "dimensions" TEXT,
    "materialInfo" TEXT,
    "images" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierSKU" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierSKU" TEXT NOT NULL,
    "supplierPrice" DOUBLE PRECISION NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 0,
    "moq" INTEGER NOT NULL DEFAULT 1,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierSKU_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_size_idx" ON "ProductVariant"("size");

-- CreateIndex
CREATE INDEX "ProductVariant_color_idx" ON "ProductVariant"("color");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierSKU_variantId_supplierId_supplierSKU_key" ON "SupplierSKU"("variantId", "supplierId", "supplierSKU");

-- CreateIndex
CREATE INDEX "SupplierSKU_variantId_idx" ON "SupplierSKU"("variantId");

-- CreateIndex
CREATE INDEX "SupplierSKU_supplierSKU_idx" ON "SupplierSKU"("supplierSKU");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierSKU" ADD CONSTRAINT "SupplierSKU_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
