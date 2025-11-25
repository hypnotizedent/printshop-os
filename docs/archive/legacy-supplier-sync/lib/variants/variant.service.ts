/**
 * Variant Service - Business logic for product variants
 */

import { PrismaClient } from '@prisma/client';
import { ProductVariant, VariantFilters, SupplierSKUMapping } from '../types';
import { generateInternalSKU } from './sku-mapper';
import { 
  normalizeSize, 
  normalizeColor, 
  calculateMarkup, 
  determineInventoryStatus,
  getColorHex,
  validateVariantData 
} from './variant-mapper';

const prisma = new PrismaClient();

/**
 * Create a new product variant
 */
export async function createVariant(data: {
  productId: string;
  sku: string;
  size?: string;
  color?: string;
  colorCode?: string;
  style?: string;
  price: number;
  wholesaleCost: number;
  inventoryQty?: number;
  weight?: number;
  dimensions?: string;
  materialInfo?: string;
  images?: string[];
  isActive?: boolean;
}): Promise<any> {
  // Validate data
  const validation = validateVariantData(data);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Check if SKU already exists
  const existing = await prisma.productVariant.findUnique({
    where: { sku: data.sku },
  });
  
  if (existing) {
    throw new Error(`Variant with SKU ${data.sku} already exists`);
  }
  
  const inventoryQty = data.inventoryQty ?? 0;
  const inventoryStatus = determineInventoryStatus(inventoryQty);
  
  return await prisma.productVariant.create({
    data: {
      productId: data.productId,
      sku: data.sku,
      size: data.size,
      color: data.color,
      colorCode: data.colorCode || (data.color ? getColorHex(data.color) : null),
      style: data.style,
      price: data.price,
      wholesaleCost: data.wholesaleCost,
      inventoryQty,
      inventoryStatus,
      weight: data.weight,
      dimensions: data.dimensions,
      materialInfo: data.materialInfo,
      images: data.images || [],
      isActive: data.isActive ?? true,
    },
    include: {
      product: true,
      supplierMappings: true,
    },
  });
}

/**
 * Get variant by ID
 */
export async function getVariantById(id: string): Promise<any | null> {
  return await prisma.productVariant.findUnique({
    where: { id },
    include: {
      product: {
        include: {
          supplier: true,
        },
      },
      supplierMappings: true,
    },
  });
}

/**
 * Get variant by SKU
 */
export async function getVariantBySKU(sku: string): Promise<any | null> {
  return await prisma.productVariant.findUnique({
    where: { sku },
    include: {
      product: {
        include: {
          supplier: true,
        },
      },
      supplierMappings: true,
    },
  });
}

/**
 * List variants with filters
 */
export async function listVariants(
  filters: VariantFilters = {},
  options: { skip?: number; take?: number; orderBy?: any } = {}
): Promise<{ variants: any[]; total: number }> {
  const where: any = {};
  
  if (filters.productId) {
    where.productId = filters.productId;
  }
  
  if (filters.size) {
    where.size = filters.size;
  }
  
  if (filters.color) {
    where.color = { contains: filters.color, mode: 'insensitive' };
  }
  
  if (filters.status) {
    where.inventoryStatus = filters.status;
  }
  
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }
  
  if (filters.search) {
    where.OR = [
      { sku: { contains: filters.search, mode: 'insensitive' } },
      { color: { contains: filters.search, mode: 'insensitive' } },
      { size: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) {
      where.price.gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      where.price.lte = filters.maxPrice;
    }
  }
  
  if (filters.brand) {
    where.product = {
      brand: filters.brand,
    };
  }
  
  const [variants, total] = await Promise.all([
    prisma.productVariant.findMany({
      where,
      include: {
        product: {
          include: {
            supplier: true,
          },
        },
        supplierMappings: true,
      },
      skip: options.skip || 0,
      take: options.take || 100,
      orderBy: options.orderBy || { createdAt: 'desc' },
    }),
    prisma.productVariant.count({ where }),
  ]);
  
  return { variants, total };
}

/**
 * Update variant
 */
export async function updateVariant(
  id: string,
  data: Partial<{
    size: string;
    color: string;
    colorCode: string;
    style: string;
    price: number;
    wholesaleCost: number;
    inventoryQty: number;
    inventoryStatus: string;
    weight: number;
    dimensions: string;
    materialInfo: string;
    images: string[];
    isActive: boolean;
  }>
): Promise<any> {
  // If inventory quantity is updated, recalculate status
  if (data.inventoryQty !== undefined && data.inventoryStatus === undefined) {
    data.inventoryStatus = determineInventoryStatus(data.inventoryQty);
  }
  
  return await prisma.productVariant.update({
    where: { id },
    data: {
      ...data,
      lastSync: data.inventoryQty !== undefined ? new Date() : undefined,
    },
    include: {
      product: true,
      supplierMappings: true,
    },
  });
}

/**
 * Delete variant
 */
export async function deleteVariant(id: string): Promise<void> {
  await prisma.productVariant.delete({
    where: { id },
  });
}

/**
 * Add supplier SKU mapping to variant
 */
export async function addSupplierMapping(
  variantId: string,
  mapping: {
    supplierId: string;
    supplierName: string;
    supplierSKU: string;
    supplierPrice: number;
    isPrimary?: boolean;
    leadTimeDays?: number;
    moq?: number;
    inStock?: boolean;
  }
): Promise<any> {
  return await prisma.supplierSKU.create({
    data: {
      variantId,
      supplierId: mapping.supplierId,
      supplierName: mapping.supplierName,
      supplierSKU: mapping.supplierSKU,
      supplierPrice: mapping.supplierPrice,
      isPrimary: mapping.isPrimary ?? false,
      leadTimeDays: mapping.leadTimeDays ?? 0,
      moq: mapping.moq ?? 1,
      inStock: mapping.inStock ?? true,
    },
  });
}

/**
 * Update supplier SKU mapping
 */
export async function updateSupplierMapping(
  id: string,
  data: Partial<{
    supplierPrice: number;
    isPrimary: boolean;
    leadTimeDays: number;
    moq: number;
    inStock: boolean;
  }>
): Promise<any> {
  return await prisma.supplierSKU.update({
    where: { id },
    data: {
      ...data,
      lastUpdated: new Date(),
    },
  });
}

/**
 * Remove supplier SKU mapping
 */
export async function removeSupplierMapping(id: string): Promise<void> {
  await prisma.supplierSKU.delete({
    where: { id },
  });
}

/**
 * Sync inventory from supplier
 */
export async function syncInventory(
  variantId: string,
  quantity: number
): Promise<any> {
  const status = determineInventoryStatus(quantity);
  
  return await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      inventoryQty: quantity,
      inventoryStatus: status,
      lastSync: new Date(),
    },
  });
}

/**
 * Get variants by product ID
 */
export async function getVariantsByProduct(productId: string): Promise<any[]> {
  return await prisma.productVariant.findMany({
    where: { productId },
    include: {
      supplierMappings: true,
    },
    orderBy: [
      { color: 'asc' },
      { size: 'asc' },
    ],
  });
}

/**
 * Search variants
 */
export async function searchVariants(
  query: string,
  options: { take?: number } = {}
): Promise<any[]> {
  return await prisma.productVariant.findMany({
    where: {
      OR: [
        { sku: { contains: query, mode: 'insensitive' } },
        { color: { contains: query, mode: 'insensitive' } },
        { size: { contains: query, mode: 'insensitive' } },
        { product: { name: { contains: query, mode: 'insensitive' } } },
        { product: { brand: { contains: query, mode: 'insensitive' } } },
      ],
    },
    include: {
      product: {
        include: {
          supplier: true,
        },
      },
      supplierMappings: true,
    },
    take: options.take || 50,
    orderBy: { updatedAt: 'desc' },
  });
}
