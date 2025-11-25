/**
 * Price Normalizer
 * Normalizes tiered pricing structures to consistent format
 */

export interface PriceTier {
  minQuantity: number;
  maxQuantity: number | null;
  price: number;
}

/**
 * Normalize pricing from various supplier formats to standard tiered format
 */
export function normalizePricing(supplierPricing: any): PriceTier[] {
  if (!supplierPricing) {
    return [];
  }
  
  // Already in tiered array format
  if (Array.isArray(supplierPricing)) {
    return normalizeArrayPricing(supplierPricing);
  }
  
  // Object format (e.g., { price1, price2, price3 } or { priceA, priceB, priceC })
  if (typeof supplierPricing === 'object') {
    return normalizeObjectPricing(supplierPricing);
  }
  
  // Single price value
  if (typeof supplierPricing === 'number') {
    return [{ minQuantity: 1, maxQuantity: null, price: supplierPricing }];
  }
  
  return [];
}

/**
 * Normalize array-based pricing
 */
function normalizeArrayPricing(pricingArray: any[]): PriceTier[] {
  return pricingArray
    .map((tier, index) => {
      const minQty = tier.qty || tier.minQty || tier.quantity || tier.minQuantity || 1;
      const maxQty = pricingArray[index + 1] 
        ? (pricingArray[index + 1].qty || pricingArray[index + 1].minQty || pricingArray[index + 1].quantity) - 1 
        : null;
      const price = tier.price || tier.cost || 0;
      
      return {
        minQuantity: minQty,
        maxQuantity: maxQty,
        price: price,
      };
    })
    .filter(tier => tier.price > 0);
}

/**
 * Normalize object-based pricing (price1/price2/price3 or priceA/priceB/priceC)
 */
function normalizeObjectPricing(pricingObj: any): PriceTier[] {
  const tiers: PriceTier[] = [];
  
  // SS Activewear style: price1, price2, price3
  if ('price1' in pricingObj || 'price2' in pricingObj || 'price3' in pricingObj) {
    if (pricingObj.price1) {
      tiers.push({
        minQuantity: 1,
        maxQuantity: 11,
        price: pricingObj.price1,
      });
    }
    
    if (pricingObj.price2) {
      tiers.push({
        minQuantity: 12,
        maxQuantity: 71,
        price: pricingObj.price2,
      });
    }
    
    if (pricingObj.price3) {
      tiers.push({
        minQuantity: 72,
        maxQuantity: null,
        price: pricingObj.price3,
      });
    }
  }
  
  // SanMar style: priceA, priceB, priceC
  else if ('priceA' in pricingObj || 'priceB' in pricingObj || 'priceC' in pricingObj) {
    if (pricingObj.priceA) {
      tiers.push({
        minQuantity: 1,
        maxQuantity: 11,
        price: pricingObj.priceA,
      });
    }
    
    if (pricingObj.priceB) {
      tiers.push({
        minQuantity: 12,
        maxQuantity: 71,
        price: pricingObj.priceB,
      });
    }
    
    if (pricingObj.priceC) {
      tiers.push({
        minQuantity: 72,
        maxQuantity: null,
        price: pricingObj.priceC,
      });
    }
  }
  
  // Generic 'price' field
  else if ('price' in pricingObj) {
    tiers.push({
      minQuantity: 1,
      maxQuantity: null,
      price: pricingObj.price,
    });
  }
  
  return tiers.filter(tier => tier.price > 0);
}

/**
 * Get price for a specific quantity
 */
export function getPriceForQuantity(tiers: PriceTier[], quantity: number): number | null {
  for (const tier of tiers) {
    if (quantity >= tier.minQuantity && 
        (tier.maxQuantity === null || quantity <= tier.maxQuantity)) {
      return tier.price;
    }
  }
  
  return null;
}

/**
 * Validate pricing tiers
 */
export function validatePricingTiers(tiers: PriceTier[]): boolean {
  if (tiers.length === 0) return false;
  
  // Check all prices are positive
  if (tiers.some(tier => tier.price <= 0)) return false;
  
  // Check quantities are valid
  if (tiers.some(tier => tier.minQuantity < 1)) return false;
  
  // Check tiers are in ascending order
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i].minQuantity <= tiers[i - 1].minQuantity) {
      return false;
    }
  }
  
  return true;
}

/**
 * Calculate average price across all tiers
 */
export function getAveragePrice(tiers: PriceTier[]): number | null {
  if (tiers.length === 0) return null;
  
  const total = tiers.reduce((sum, tier) => sum + tier.price, 0);
  return total / tiers.length;
}
