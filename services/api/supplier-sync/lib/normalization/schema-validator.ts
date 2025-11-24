/**
 * Schema Validator
 * Validates normalized data using Zod schemas
 */

import { z } from 'zod';

/**
 * Price tier schema
 */
export const PriceTierSchema = z.object({
  minQuantity: z.number().positive(),
  maxQuantity: z.number().nullable(),
  price: z.number().positive(),
});

/**
 * Specifications schema
 */
export const SpecificationsSchema = z.object({
  weight: z.number().positive().optional().nullable(),
  material: z.string().optional().nullable(),
  fit: z.enum(['Standard', 'Slim', 'Relaxed', 'Athletic']).optional().nullable(),
});

/**
 * Color variant schema
 */
export const ColorVariantSchema = z.object({
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  supplierColorName: z.string().optional(),
});

/**
 * Normalized product schema
 */
export const NormalizedProductSchema = z.object({
  // Required fields
  brand: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  sku: z.string().min(1),
  
  // Variant attributes
  size: z.string(),
  color: z.string(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  style: z.string().optional(),
  
  // Pricing
  pricing: z.array(PriceTierSchema).min(1),
  
  // Specifications
  specifications: SpecificationsSchema.optional(),
  
  // Metadata
  supplierSKU: z.string().min(1),
  supplierId: z.string().min(1),
  lastUpdated: z.date().optional(),
  
  // Matching
  matchedProductId: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
});

export type NormalizedProduct = z.infer<typeof NormalizedProductSchema>;

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data?: NormalizedProduct;
}

/**
 * Validate normalized product data
 */
export function validateProduct(product: any): ValidationResult {
  const result = NormalizedProductSchema.safeParse(product);
  
  if (result.success) {
    return {
      valid: true,
      errors: [],
      data: result.data,
    };
  }
  
  const errors: ValidationError[] = result.error.issues.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    value: err.path.reduce((obj: any, key: any) => obj?.[key], product),
  }));
  
  return {
    valid: false,
    errors,
  };
}

/**
 * Validate multiple products
 */
export function validateProducts(products: any[]): {
  valid: NormalizedProduct[];
  invalid: Array<{ product: any; errors: ValidationError[] }>;
} {
  const valid: NormalizedProduct[] = [];
  const invalid: Array<{ product: any; errors: ValidationError[] }> = [];
  
  for (const product of products) {
    const result = validateProduct(product);
    
    if (result.valid && result.data) {
      valid.push(result.data);
    } else {
      invalid.push({ product, errors: result.errors });
    }
  }
  
  return { valid, invalid };
}

/**
 * Check if product has required fields
 */
export function hasRequiredFields(product: any): boolean {
  const requiredFields = ['brand', 'name', 'category', 'sku', 'size', 'color', 'pricing', 'supplierSKU', 'supplierId'];
  
  return requiredFields.every(field => {
    const value = product[field];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== null && value !== undefined && value !== '';
  });
}

/**
 * Validate SKU format
 */
export function validateSKUFormat(sku: string): boolean {
  // Internal format: BRAND-STYLE-COLOR-SIZE
  const regex = /^[A-Z]{2,3}-[A-Z0-9]{1,6}-[A-Z]{3}-[A-Z0-9\s]+$/;
  return regex.test(sku);
}

/**
 * Validate hex color format
 */
export function validateHexColor(hex: string): boolean {
  const regex = /^#[0-9A-Fa-f]{6}$/;
  return regex.test(hex);
}
