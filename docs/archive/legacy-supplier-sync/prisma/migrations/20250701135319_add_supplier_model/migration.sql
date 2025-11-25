/*
  Warnings:

  - You are about to drop the column `supplier` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[supplierId,styleId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Product_styleId_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "supplier",
ADD COLUMN     "colors" TEXT[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "sizes" TEXT[],
ADD COLUMN     "supplierId" TEXT;

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_supplierId_styleId_key" ON "Product"("supplierId", "styleId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
