-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "material" TEXT,
    "imageUrls" TEXT[],
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_styleId_key" ON "Product"("styleId");
