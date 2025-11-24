/**
 * Pricing Configuration
 * 
 * Centralized pricing rates and configuration for quote optimization.
 * Update these values to reflect current pricing without modifying core logic.
 */

export interface PricingConfig {
  // Base rates per print method (per unit)
  methodRates: Record<string, number>;
  
  // Setup fees per method
  setupFees: Record<string, number>;
  
  // Color pricing (per additional color for screen printing)
  colorAdditionalCost: number;
  
  // Size multipliers
  sizeMultipliers: Record<string, number>;
  
  // Volume discount thresholds and multipliers
  volumeDiscounts: Array<{
    minQuantity: number;
    multiplier: number;
  }>;
  
  // Add-on pricing
  addOnPricing: {
    foldAndBag: number;        // per unit
    customTags: number;         // per unit
    hangTickets: number;        // per unit
    polyBags: number;           // per unit
  };
  
  // Rush pricing (per unit)
  rushPricing: {
    rush: number;              // 5-6 days
    superRush: number;         // 3-4 days
    emergency: number;         // 1-2 days
  };
  
  // Upgrade pricing
  upgradePricing: {
    premiumInk: number;        // per unit
    sizeUpgrade: number;       // per unit
  };
}

/**
 * Default pricing configuration
 */
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  methodRates: {
    'screen-print': 7.50,
    'DTG': 12.00,
    'embroidery': 15.00,
    'sublimation': 10.00,
  },
  
  setupFees: {
    'screen-print': 50.00,  // multiplied by colors
    'DTG': 25.00,
    'embroidery': 75.00,
    'sublimation': 35.00,
  },
  
  colorAdditionalCost: 1.25,  // per additional color (screen print)
  
  sizeMultipliers: {
    'S': 0.9,
    'M': 1.0,
    'L': 1.2,
    'XL': 1.4,
  },
  
  volumeDiscounts: [
    { minQuantity: 2000, multiplier: 0.70 },
    { minQuantity: 1000, multiplier: 0.75 },
    { minQuantity: 500, multiplier: 0.85 },
  ],
  
  addOnPricing: {
    foldAndBag: 0.50,
    customTags: 1.25,
    hangTickets: 0.75,
    polyBags: 0.35,
  },
  
  rushPricing: {
    rush: 3.00,        // 5-6 days
    superRush: 5.50,   // 3-4 days
    emergency: 8.00,   // 1-2 days
  },
  
  upgradePricing: {
    premiumInk: 2.00,
    sizeUpgrade: 1.50,
  },
};

/**
 * Get pricing configuration (can be overridden with custom config)
 */
export function getPricingConfig(customConfig?: Partial<PricingConfig>): PricingConfig {
  return {
    ...DEFAULT_PRICING_CONFIG,
    ...customConfig,
  };
}
