-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "code" TEXT,
ADD COLUMN IF NOT EXISTS "apiUrl" TEXT,
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Create unique index on Supplier.code if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Supplier_code_key') THEN
        CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");
    END IF;
END $$;

-- AlterTable - Update Product to use Json type for colors if needed
ALTER TABLE "Product" ALTER COLUMN "colors" TYPE JSONB USING "colors"::jsonb;

-- CreateTable SupplierInventory
CREATE TABLE IF NOT EXISTS "SupplierInventory" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierSKU" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "threshold" INTEGER NOT NULL DEFAULT 50,
    "price" DOUBLE PRECISION NOT NULL,
    "priceLastChanged" TIMESTAMP(3),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "leadTime" INTEGER NOT NULL DEFAULT 0,
    "backorderDate" TIMESTAMP(3),
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncSource" TEXT NOT NULL DEFAULT 'manual',
    "syncError" TEXT,
    "previousQuantity" INTEGER,
    "previousPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable InventorySyncLog
CREATE TABLE IF NOT EXISTS "InventorySyncLog" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "variantsSynced" INTEGER NOT NULL DEFAULT 0,
    "changesDetected" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventorySyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable InventoryChange
CREATE TABLE IF NOT EXISTS "InventoryChange" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SupplierInventory_variantId_supplierId_key" ON "SupplierInventory"("variantId", "supplierId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupplierInventory_supplierSKU_idx" ON "SupplierInventory"("supplierSKU");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupplierInventory_status_idx" ON "SupplierInventory"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InventorySyncLog_status_idx" ON "InventorySyncLog"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InventorySyncLog_startedAt_idx" ON "InventorySyncLog"("startedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InventoryChange_detectedAt_idx" ON "InventoryChange"("detectedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InventoryChange_changeType_idx" ON "InventoryChange"("changeType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InventoryChange_notified_idx" ON "InventoryChange"("notified");

-- AddForeignKey
ALTER TABLE "SupplierInventory" ADD CONSTRAINT IF NOT EXISTS "SupplierInventory_variantId_fkey" 
    FOREIGN KEY ("variantId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInventory" ADD CONSTRAINT IF NOT EXISTS "SupplierInventory_supplierId_fkey" 
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySyncLog" ADD CONSTRAINT IF NOT EXISTS "InventorySyncLog_supplierId_fkey" 
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryChange" ADD CONSTRAINT IF NOT EXISTS "InventoryChange_variantId_supplierId_fkey" 
    FOREIGN KEY ("variantId", "supplierId") REFERENCES "SupplierInventory"("variantId", "supplierId") ON DELETE RESTRICT ON UPDATE CASCADE;
