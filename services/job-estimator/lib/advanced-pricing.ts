/**
 * Advanced Pricing Engine for Print Shop Order Quotes
 *
 * Handles complex pricing scenarios:
 * - Multiple print locations
 * - Print size complexity
 * - Rush order premiums
 * - Add-ons (fold, ticket, relabel, etc.)
 * - Volume discounts
 * - 35% profit margin
 *
 * Formula:
 * Base Price = (service_base + color_surcharge) * size_multiplier
 * Location Price = Base Price * location_multiplier
 * Rush Price = Location Price * rush_multiplier
 * With AddOns = Rush Price + (addon_price * quantity)
 * Final Price = (With AddOns) * 1.35 (35% margin)
 */

import {
  PricingOptions,
  PrintLocation,
  PrintSize,
  RushType,
  AddOnType,
  LOCATION_MULTIPLIERS,
  PRINT_SIZE_MULTIPLIERS,
  RUSH_MULTIPLIERS,
  calculateBasePrice,
} from './pricing-engine';

// Re-export types
export type { PrintLocation, PrintSize, RushType, AddOnType, PricingOptions };

// Add-on pricing per unit
export const ADD_ON_PRICING: Record<AddOnType, number> = {
  'fold': 0.15,
  'ticket': 0.10,
  'relabel': 0.20,
  'hanger': 0.25,
};

// Volume discount breakpoints
export const VOLUME_DISCOUNTS = [
  { minQty: 1, maxQty: 49, discount: 0.0 },
  { minQty: 50, maxQty: 99, discount: 0.05 },
  { minQty: 100, maxQty: 249, discount: 0.08 },
  { minQty: 250, maxQty: 499, discount: 0.10 },
  { minQty: 500, maxQty: 999, discount: 0.12 },
  { minQty: 1000, maxQty: Infinity, discount: 0.15 },
];

export interface QuoteBreakdown {
  quantity: number;
  service: string;
  colors: number;
  location: PrintLocation;
  printSize: PrintSize;
  rush: RushType;
  addOns: AddOnType[];
  
  // Calculations
  unitPrice: number;
  setupFee: number;
  subtotal: number;
  locationMultiplier: number;
  locationPrice: number;
  sizeMultiplier: number;
  rushMultiplier: number;
  rushPrice: number;
  addOnCost: number;
  subtotalWithAddOns: number;
  volumeDiscount: number;
  discountedPrice: number;
  profitMarginMultiplier: number;
  finalRetailPrice: number;
}

export interface QuoteOptions {
  quantity: number;
  service: 'screen' | 'embroidery' | 'laser' | 'transfer' | 'dtg' | 'sublimation';
  colors?: number;
  location?: PrintLocation;
  printSize?: PrintSize;
  rush?: RushType;
  addOns?: AddOnType[];
  isNewDesign?: boolean;
  profitMargin?: number; // defaults to 0.35 (35%)
}

/**
 * Get volume discount percentage for given quantity
 */
export function getVolumeDiscount(quantity: number): number {
  for (const tier of VOLUME_DISCOUNTS) {
    if (quantity >= tier.minQty && quantity <= tier.maxQty) {
      return tier.discount;
    }
  }
  return 0;
}

/**
 * Calculate comprehensive quote with all pricing factors
 */
export function generateQuote(options: QuoteOptions): QuoteBreakdown {
  const {
    quantity,
    service,
    colors = 1,
    location = 'chest',
    printSize = 'M',
    rush = 'standard',
    addOns = [],
    isNewDesign = false,
    profitMargin = 0.35,
  } = options;

  // Step 1: Calculate base pricing
  const pricingOpts: PricingOptions = {
    service: service as any,
    colors,
    size: printSize,
    location,
    rush,
    addOns,
    isNewDesign,
  };

  const baseCalc = calculateBasePrice(quantity, pricingOpts);
  const { unitPrice, setupFee, subtotal } = baseCalc;

  // Step 2: Apply location multiplier
  const locationMultiplier = LOCATION_MULTIPLIERS[location];
  const locationPrice = subtotal * locationMultiplier;

  // Step 3: Apply print size multiplier (already in unitPrice, but need for breakdown)
  const sizeMultiplier = PRINT_SIZE_MULTIPLIERS[printSize];

  // Step 4: Apply rush multiplier
  const rushMultiplier = RUSH_MULTIPLIERS[rush];
  const rushPrice = locationPrice * rushMultiplier;

  // Step 5: Calculate add-on costs
  let addOnCost = 0;
  for (const addon of addOns) {
    addOnCost += (ADD_ON_PRICING[addon] ?? 0) * quantity;
  }
  const subtotalWithAddOns = rushPrice + addOnCost;

  // Step 6: Apply volume discount
  const volumeDiscount = getVolumeDiscount(quantity);
  const discountedPrice = subtotalWithAddOns * (1 - volumeDiscount);

  // Step 7: Apply profit margin
  const profitMarginMultiplier = 1 + profitMargin;
  const finalRetailPrice = discountedPrice * profitMarginMultiplier;

  return {
    quantity,
    service,
    colors,
    location,
    printSize,
    rush,
    addOns,
    unitPrice: Number(unitPrice.toFixed(2)),
    setupFee: Number(setupFee.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    locationMultiplier,
    locationPrice: Number(locationPrice.toFixed(2)),
    sizeMultiplier,
    rushMultiplier,
    rushPrice: Number(rushPrice.toFixed(2)),
    addOnCost: Number(addOnCost.toFixed(2)),
    subtotalWithAddOns: Number(subtotalWithAddOns.toFixed(2)),
    volumeDiscount,
    discountedPrice: Number(discountedPrice.toFixed(2)),
    profitMarginMultiplier,
    finalRetailPrice: Number(finalRetailPrice.toFixed(2)),
  };
}

/**
 * Calculate cost of goods (without margin)
 */
export function calculateCost(options: QuoteOptions): number {
  const quote = generateQuote({ ...options, profitMargin: 0 });
  return quote.discountedPrice;
}

/**
 * Calculate profit for an order
 */
export function calculateProfit(options: QuoteOptions, profitMargin: number = 0.35): number {
  const quote = generateQuote({ ...options, profitMargin });
  const cost = calculateCost(options);
  return Number((quote.finalRetailPrice - cost).toFixed(2));
}

/**
 * Calculate break-even quantity for a design setup
 * (when does the setup fee get covered by unit price difference?)
 */
export function calculateBreakEvenQuantity(
  _baseUnitPrice: number,
  setupFee: number,
  costReduction: number
): number {
  if (costReduction <= 0) return Infinity;
  return Math.ceil(setupFee / costReduction);
}

/**
 * Multi-location order pricing (e.g., chest + back print)
 */
export function calculateMultiLocationOrder(
  baseOptions: QuoteOptions,
  locations: PrintLocation[]
): QuoteBreakdown[] {
  return locations.map(location =>
    generateQuote({ ...baseOptions, location })
  );
}

/**
 * Calculate total for multi-location order
 */
export function calculateMultiLocationTotal(
  baseOptions: QuoteOptions,
  locations: PrintLocation[]
): number {
  const quotes = calculateMultiLocationOrder(baseOptions, locations);
  return Number(
    quotes
      .reduce((sum, q) => sum + q.finalRetailPrice, 0)
      .toFixed(2)
  );
}

/**
 * Compare pricing across different rush options
 */
export function compareRushOptions(
  options: QuoteOptions
): Record<RushType, number> {
  const rushTypes: RushType[] = ['standard', '2-day', 'next-day', 'same-day'];
  const result: Record<RushType, number> = {} as any;

  for (const rush of rushTypes) {
    const quote = generateQuote({ ...options, rush });
    result[rush] = quote.finalRetailPrice;
  }

  return result;
}

/**
 * Get minimum quantity for a discount tier
 */
export function getMinQtyForDiscount(targetDiscount: number): number {
  for (const tier of VOLUME_DISCOUNTS) {
    if (tier.discount >= targetDiscount) {
      return tier.minQty;
    }
  }
  return VOLUME_DISCOUNTS[VOLUME_DISCOUNTS.length - 1].minQty;
}

/**
 * Calculate price reduction from bulk purchase
 */
export function calculateBulkSavings(
  options: QuoteOptions,
  currentQty: number,
  targetQty: number
): number {
  const currentQuote = generateQuote({ ...options, quantity: currentQty });
  const targetQuote = generateQuote({ ...options, quantity: targetQty });

  const currentUnitPrice = currentQuote.finalRetailPrice / currentQty;
  const targetUnitPrice = targetQuote.finalRetailPrice / targetQty;

  return Number(((currentUnitPrice - targetUnitPrice) * targetQty).toFixed(2));
}
