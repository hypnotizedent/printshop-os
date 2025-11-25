/**
 * Data Normalizer Service
 * Main orchestrator for normalizing supplier data
 */

import { getMappingForSupplier } from '../mappings/base.mapping';
import { extractFields, normalizeBrand, normalizeName, normalizeCategory, normalizeWeight, normalizeMaterial, normalizeFit, normalizeStyle } from './attribute-mapper';
import { normalizeSize } from './size-normalizer';
import { normalizeColor } from './color-normalizer';
import { normalizeSKU } from './sku-normalizer';
import { normalizePricing } from './price-normalizer';
import { validateProduct, NormalizedProduct, ValidationResult } from './schema-validator';
import { findMatchingProduct, ProductMatch, MatchOptions } from './fuzzy-matcher';

// Import mappings to register them
import '../mappings/ss-activewear.mapping';
import '../mappings/sanmar.mapping';
import '../mappings/as-colour.mapping';

export interface NormalizationResult {
  product: NormalizedProduct | null;
  validation: ValidationResult;
  warnings: string[];
  errors: string[];
}

export interface NormalizationOptions {
  validateSchema?: boolean;
  findMatches?: boolean;
  existingProducts?: any[];
  matchOptions?: MatchOptions;
}

export class DataNormalizer {
  /**
   * Normalize a single product from supplier data
   */
  async normalizeProduct(
    supplierData: any,
    supplierId: string,
    options: NormalizationOptions = {}
  ): Promise<NormalizationResult> {
    const {
      validateSchema = true,
      findMatches = false,
      existingProducts = [],
      matchOptions = {},
    } = options;
    
    const warnings: string[] = [];
    const errors: string[] = [];
    
    try {
      // Step 1: Get supplier-specific mapping
      const mapping = getMappingForSupplier(supplierId);
      if (!mapping) {
        errors.push(`No mapping found for supplier: ${supplierId}`);
        return {
          product: null,
          validation: { valid: false, errors: [{ field: 'supplierId', message: 'Unknown supplier' }] },
          warnings,
          errors,
        };
      }
      
      // Step 2: Extract raw data using mapping
      const raw = extractFields(supplierData, mapping);
      
      // Step 3: Normalize attributes
      const brand = normalizeBrand(raw.brand);
      const name = normalizeName(raw.name, brand);
      const category = normalizeCategory(raw.category);
      const style = normalizeStyle(raw.styleId || raw.sku);
      
      // Step 4: Normalize variant attributes
      const size = normalizeSize(raw.size);
      const colorResult = normalizeColor(raw.color);
      
      // Track warnings for unknown values
      if (size === 'Unknown') {
        warnings.push(`Unknown size value: ${raw.size}`);
      }
      if (colorResult.name === 'Unknown' || colorResult.name === raw.color) {
        warnings.push(`Unknown or unmapped color: ${raw.color}`);
      }
      
      // Step 5: Normalize pricing
      const pricing = normalizePricing(raw.price || supplierData.pricing);
      if (pricing.length === 0) {
        errors.push('No valid pricing data found');
      }
      
      // Step 6: Generate internal SKU
      const sku = normalizeSKU(
        raw.sku || supplierData.sku || '',
        supplierId,
        brand,
        style,
        colorResult.name,
        size
      );
      
      // Step 7: Build normalized product
      const normalized: any = {
        brand,
        name,
        category,
        sku,
        size,
        color: colorResult.name,
        colorHex: colorResult.hex,
        style,
        pricing,
        specifications: {
          weight: normalizeWeight(raw.weight),
          material: normalizeMaterial(raw.material),
          fit: normalizeFit(raw.fit),
        },
        supplierSKU: raw.sku || supplierData.sku || '',
        supplierId,
        lastUpdated: new Date(),
      };
      
      // Step 8: Find matching products (fuzzy)
      if (findMatches && existingProducts.length > 0) {
        const match = findMatchingProduct(normalized, existingProducts, matchOptions);
        if (match) {
          normalized.matchedProductId = match.id;
          normalized.confidence = match.confidence;
        }
      }
      
      // Step 9: Validate
      let validation: ValidationResult = { valid: true, errors: [] };
      if (validateSchema) {
        validation = validateProduct(normalized);
        if (!validation.valid) {
          errors.push(...validation.errors.map(e => `${e.field}: ${e.message}`));
        }
      }
      
      return {
        product: validation.valid ? (validation.data || normalized) : normalized,
        validation,
        warnings,
        errors,
      };
    } catch (error) {
      errors.push(`Normalization failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        product: null,
        validation: { valid: false, errors: [{ field: 'unknown', message: String(error) }] },
        warnings,
        errors,
      };
    }
  }
  
  /**
   * Normalize multiple products
   */
  async normalizeProducts(
    supplierDataArray: any[],
    supplierId: string,
    options: NormalizationOptions = {}
  ): Promise<{
    successful: NormalizedProduct[];
    failed: Array<{ data: any; result: NormalizationResult }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      warnings: number;
    };
  }> {
    const successful: NormalizedProduct[] = [];
    const failed: Array<{ data: any; result: NormalizationResult }> = [];
    let totalWarnings = 0;
    
    for (const data of supplierDataArray) {
      const result = await this.normalizeProduct(data, supplierId, options);
      
      totalWarnings += result.warnings.length;
      
      if (result.validation.valid && result.product) {
        successful.push(result.product);
      } else {
        failed.push({ data, result });
      }
    }
    
    return {
      successful,
      failed,
      summary: {
        total: supplierDataArray.length,
        successful: successful.length,
        failed: failed.length,
        warnings: totalWarnings,
      },
    };
  }
  
  /**
   * Get normalization report
   */
  generateReport(results: {
    successful: NormalizedProduct[];
    failed: Array<{ data: any; result: NormalizationResult }>;
    summary: any;
  }): string {
    const { successful, failed, summary } = results;
    
    let report = 'DATA NORMALIZATION REPORT\n';
    report += '═'.repeat(60) + '\n\n';
    
    report += 'Summary:\n';
    report += '─'.repeat(60) + '\n';
    report += `✓ Successfully normalized: ${summary.successful} products\n`;
    report += `⚠️ Warnings: ${summary.warnings}\n`;
    report += `❌ Errors: ${summary.failed} products\n\n`;
    
    if (failed.length > 0) {
      report += 'Failed Products:\n';
      report += '─'.repeat(60) + '\n';
      
      failed.slice(0, 10).forEach((item, index) => {
        report += `\n${index + 1}. Product: ${item.data.name || item.data.styleName || 'Unknown'}\n`;
        
        if (item.result.errors.length > 0) {
          report += `   Errors:\n`;
          item.result.errors.forEach(err => {
            report += `   • ${err}\n`;
          });
        }
        
        if (item.result.warnings.length > 0) {
          report += `   Warnings:\n`;
          item.result.warnings.forEach(warn => {
            report += `   • ${warn}\n`;
          });
        }
      });
      
      if (failed.length > 10) {
        report += `\n... and ${failed.length - 10} more failed products\n`;
      }
    }
    
    return report;
  }
}
