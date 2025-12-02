/**
 * Pricing Service
 * Handles quote calculations and pricing logic for the product customizer
 */

export interface PricingRequest {
  garmentType: string;
  printMethod: string;
  quantity: number;
  numColors: number;
  rushOrder?: boolean;
  customOptions?: Record<string, unknown>;
}

export interface PricingBreakdown {
  basePrice: number;
  garmentCost: number;
  printCost: number;
  setupFee: number;
  colorFees: number;
  rushFee: number;
  discount: number;
  subtotal: number;
  total: number;
  perUnitPrice: number;
}

export interface QuoteResult {
  success: boolean;
  pricing: PricingBreakdown;
  request: PricingRequest;
  tier: string;
  estimatedDays: number;
  generatedAt: string;
}

// Base garment prices by type
export const BASE_GARMENT_PRICES: Record<string, number> = {
  't-shirt': 19.99,
  'hoodie': 39.99,
  'tank-top': 16.99,
  'long-sleeve': 24.99,
  'polo': 29.99,
  'sweatshirt': 34.99,
  'hat': 24.99,
  'jacket': 49.99,
};

// Print method pricing configuration
export const PRINT_METHOD_CONFIG: Record<string, { 
  setup: number; 
  perColor: number;
  flatRate?: number;
  minQuantity?: number;
}> = {
  'screen-print': { 
    setup: 25, 
    perColor: 15,
    minQuantity: 12 
  },
  'dtg': { 
    setup: 0, 
    perColor: 0, 
    flatRate: 8 
  },
  'embroidery': { 
    setup: 35, 
    perColor: 10 
  },
  'heat-transfer': { 
    setup: 15, 
    perColor: 5 
  },
  'sublimation': { 
    setup: 10, 
    perColor: 0, 
    flatRate: 12 
  },
};

// Quantity discount tiers
export const QUANTITY_TIERS = [
  { minQty: 1, maxQty: 11, discount: 0, label: 'Sample', daysToShip: 7 },
  { minQty: 12, maxQty: 35, discount: 2, label: 'Team', daysToShip: 5 },
  { minQty: 36, maxQty: 71, discount: 4, label: 'Bulk', daysToShip: 5 },
  { minQty: 72, maxQty: Infinity, discount: 6, label: 'Wholesale', daysToShip: 7 },
];

export class PricingService {
  /**
   * Get the quantity discount for a given quantity
   */
  static getQuantityDiscount(quantity: number): number {
    const tier = QUANTITY_TIERS.find(
      t => quantity >= t.minQty && quantity <= t.maxQty
    );
    return tier ? tier.discount : 0;
  }

  /**
   * Get the tier label for a given quantity
   */
  static getTierLabel(quantity: number): string {
    const tier = QUANTITY_TIERS.find(
      t => quantity >= t.minQty && quantity <= t.maxQty
    );
    return tier ? tier.label : 'Sample';
  }

  /**
   * Get estimated days to ship based on quantity
   */
  static getEstimatedDays(quantity: number, rushOrder: boolean): number {
    const tier = QUANTITY_TIERS.find(
      t => quantity >= t.minQty && quantity <= t.maxQty
    );
    const baseDays = tier ? tier.daysToShip : 7;
    return rushOrder ? Math.ceil(baseDays / 2) : baseDays;
  }

  /**
   * Calculate complete pricing for a quote request
   */
  static calculatePricing(request: PricingRequest): PricingBreakdown {
    // Get base garment price
    const basePrice = BASE_GARMENT_PRICES[request.garmentType] || 19.99;
    
    // Get print method configuration
    const printConfig = PRINT_METHOD_CONFIG[request.printMethod] || { 
      setup: 0, 
      perColor: 0 
    };
    
    // Calculate garment cost
    const garmentCost = basePrice;
    
    // Calculate print cost
    let printCost: number;
    if (printConfig.flatRate !== undefined) {
      // DTG, sublimation use flat rate
      printCost = printConfig.flatRate;
    } else {
      // Screen print, embroidery, heat transfer use per-color
      printCost = printConfig.perColor * Math.max(request.numColors, 1);
    }
    
    // Setup fee (one-time)
    const setupFee = printConfig.setup;
    
    // Quantity discount (per unit, negative value)
    const quantityDiscount = this.getQuantityDiscount(request.quantity);
    
    // Rush order fee (25% extra per unit)
    const rushFeePerUnit = request.rushOrder 
      ? (garmentCost + printCost) * 0.25 
      : 0;
    
    // Per unit calculations
    const perUnitBeforeDiscount = garmentCost + printCost + rushFeePerUnit;
    const perUnitAfterDiscount = perUnitBeforeDiscount - quantityDiscount;
    
    // Totals
    const subtotalWithoutSetup = perUnitAfterDiscount * request.quantity;
    const subtotal = subtotalWithoutSetup + setupFee;
    const total = subtotal;
    
    // Final per-unit price (including amortized setup)
    const perUnitPrice = perUnitAfterDiscount + (setupFee / request.quantity);
    
    return {
      basePrice,
      garmentCost,
      printCost,
      setupFee,
      colorFees: printConfig.perColor * Math.max(request.numColors, 1),
      rushFee: rushFeePerUnit * request.quantity,
      discount: quantityDiscount * request.quantity,
      subtotal,
      total,
      perUnitPrice,
    };
  }

  /**
   * Generate a complete quote
   */
  static generateQuote(request: PricingRequest): QuoteResult {
    const pricing = this.calculatePricing(request);
    const tier = this.getTierLabel(request.quantity);
    const estimatedDays = this.getEstimatedDays(
      request.quantity, 
      request.rushOrder || false
    );
    
    return {
      success: true,
      pricing,
      request,
      tier,
      estimatedDays,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Validate a pricing request
   */
  static validateRequest(request: Partial<PricingRequest>): { 
    valid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];
    
    if (!request.garmentType) {
      errors.push('garmentType is required');
    } else if (!BASE_GARMENT_PRICES[request.garmentType]) {
      errors.push(`Invalid garmentType: ${request.garmentType}`);
    }
    
    if (!request.printMethod) {
      errors.push('printMethod is required');
    } else if (!PRINT_METHOD_CONFIG[request.printMethod]) {
      errors.push(`Invalid printMethod: ${request.printMethod}`);
    }
    
    if (!request.quantity || request.quantity < 1) {
      errors.push('quantity must be at least 1');
    }
    
    if (request.numColors !== undefined && request.numColors < 1) {
      errors.push('numColors must be at least 1');
    }
    
    // Check minimum quantity for screen print
    if (
      request.printMethod === 'screen-print' && 
      request.quantity && 
      request.quantity < 12
    ) {
      errors.push('Screen print requires a minimum of 12 units');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available pricing options
   */
  static getPricingOptions() {
    return {
      garmentTypes: Object.keys(BASE_GARMENT_PRICES).map(type => ({
        id: type,
        name: type.split('-').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' '),
        basePrice: BASE_GARMENT_PRICES[type],
      })),
      printMethods: Object.keys(PRINT_METHOD_CONFIG).map(method => ({
        id: method,
        name: method.split('-').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' '),
        ...PRINT_METHOD_CONFIG[method],
      })),
      quantityTiers: QUANTITY_TIERS.map(tier => ({
        ...tier,
        maxQty: tier.maxQty === Infinity ? null : tier.maxQty,
      })),
      rushOrderMultiplier: 1.25,
    };
  }
}

export default PricingService;
