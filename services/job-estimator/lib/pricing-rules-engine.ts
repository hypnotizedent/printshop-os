/**
 * JSON-Based Pricing Rules Engine
 * 
 * Provides flexible, maintainable pricing rules that can be edited by non-technical users.
 * Supports versioning, precedence, and audit trails.
 */

export interface PricingRuleConditions {
  quantity_min?: number;
  quantity_max?: number;
  service?: string[];
  colors_min?: number;
  colors_max?: number;
  location?: string[];
  customer_type?: string[];
  garment_type?: string[];
  supplier?: string[];
}

export interface PricingRuleCalculations {
  discount_pct?: number;
  surcharge_pct?: number;
  location_surcharge?: { [key: string]: number };
  color_multiplier?: { [key: string]: number };
  stitch_price_per_1000?: number;
  margin_target?: number;
  setup_fee?: number;
  unit_price_override?: number;
}

export interface PricingRule {
  id: string;
  description: string;
  version: number;
  effective_date: string;
  expiry_date?: string;
  conditions: PricingRuleConditions;
  calculations: PricingRuleCalculations;
  priority: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PricingInput {
  garment_id?: string;
  quantity: number;
  service?: string;
  print_locations?: string[];
  color_count?: number;
  stitch_count?: number;
  customer_type?: string;
  garment_type?: string;
  supplier?: string;
  is_rush?: boolean;
  rush_type?: string;
}

export interface LineItem {
  description: string;
  unit_cost?: number;
  qty?: number;
  total: number;
  factor?: number;
  discount?: number;
}

export interface PricingOutput {
  line_items: LineItem[];
  subtotal: number;
  margin_pct: number;
  total_price: number;
  breakdown: {
    base_cost: number;
    location_surcharges: number;
    color_adjustments: number;
    volume_discounts: number;
    margin_amount: number;
  };
  rules_applied: string[];
  calculation_time_ms: number;
}

/**
 * Check if a rule's conditions match the input
 */
export function evaluateRuleConditions(
  rule: PricingRule,
  input: PricingInput
): boolean {
  const { conditions } = rule;

  // Check quantity range
  if (conditions.quantity_min !== undefined && input.quantity < conditions.quantity_min) {
    return false;
  }
  if (conditions.quantity_max !== undefined && input.quantity > conditions.quantity_max) {
    return false;
  }

  // Check service
  if (conditions.service && input.service && !conditions.service.includes(input.service)) {
    return false;
  }

  // Check color count
  if (conditions.colors_min !== undefined && input.color_count !== undefined) {
    if (input.color_count < conditions.colors_min) {
      return false;
    }
  }
  if (conditions.colors_max !== undefined && input.color_count !== undefined) {
    if (input.color_count > conditions.colors_max) {
      return false;
    }
  }

  // Check location
  if (conditions.location && input.print_locations) {
    const hasMatchingLocation = input.print_locations.some(loc =>
      conditions.location!.includes(loc)
    );
    if (!hasMatchingLocation) {
      return false;
    }
  }

  // Check customer type
  if (conditions.customer_type && input.customer_type) {
    if (!conditions.customer_type.includes(input.customer_type)) {
      return false;
    }
  }

  // Check garment type
  if (conditions.garment_type && input.garment_type) {
    if (!conditions.garment_type.includes(input.garment_type)) {
      return false;
    }
  }

  // Check supplier
  if (conditions.supplier && input.supplier) {
    if (!conditions.supplier.includes(input.supplier)) {
      return false;
    }
  }

  return true;
}

/**
 * Find all matching rules sorted by priority (highest first)
 */
export function findMatchingRules(
  rules: PricingRule[],
  input: PricingInput
): PricingRule[] {
  const now = new Date();

  return rules
    .filter(rule => {
      // Check if rule is enabled
      if (!rule.enabled) {
        return false;
      }

      // Check effective date
      const effectiveDate = new Date(rule.effective_date);
      if (effectiveDate > now) {
        return false;
      }

      // Check expiry date
      if (rule.expiry_date) {
        const expiryDate = new Date(rule.expiry_date);
        if (expiryDate < now) {
          return false;
        }
      }

      // Check conditions
      return evaluateRuleConditions(rule, input);
    })
    .sort((a, b) => b.priority - a.priority); // Higher priority first
}

/**
 * Apply location surcharges based on rules
 */
export function applyLocationSurcharges(
  _baseCost: number,
  locations: string[],
  rules: PricingRule[]
): { total: number; breakdown: { [key: string]: number } } {
  let totalSurcharge = 0;
  const breakdown: { [key: string]: number } = {};

  // Default surcharges (can be overridden by rules)
  const defaultSurcharges: { [key: string]: number } = {
    'front': 2.0,
    'back': 3.0,
    'sleeve': 1.5,
    'chest': 0,
    'left-chest': 0,
    'pocket': 1.0,
  };

  // Get surcharges from highest priority rule or use defaults
  let surchargeMap = defaultSurcharges;
  for (const rule of rules) {
    if (rule.calculations.location_surcharge) {
      surchargeMap = { ...defaultSurcharges, ...rule.calculations.location_surcharge };
      break;
    }
  }

  for (const location of locations) {
    const surcharge = surchargeMap[location] || 0;
    breakdown[location] = surcharge;
    totalSurcharge += surcharge;
  }

  return { total: totalSurcharge, breakdown };
}

/**
 * Apply color multipliers based on rules
 */
export function applyColorMultiplier(
  baseCost: number,
  colorCount: number,
  rules: PricingRule[]
): { multiplier: number; adjustedCost: number } {
  // Default multipliers (can be overridden by rules)
  let multiplier = 1.0;

  if (colorCount === 1) {
    multiplier = 1.0;
  } else if (colorCount >= 2) {
    multiplier = 1.3;
  }

  // Check for rule-based multipliers
  for (const rule of rules) {
    if (rule.calculations.color_multiplier) {
      const colorKey = colorCount.toString();
      if (rule.calculations.color_multiplier[colorKey]) {
        multiplier = rule.calculations.color_multiplier[colorKey];
        break;
      }
    }
  }

  return {
    multiplier,
    adjustedCost: baseCost * multiplier,
  };
}

/**
 * Apply volume discounts based on rules
 */
export function applyVolumeDiscount(
  subtotal: number,
  quantity: number,
  rules: PricingRule[]
): { discount_pct: number; discount_amount: number; final_amount: number } {
  let discount_pct = 0;

  // Default volume discounts
  if (quantity >= 1 && quantity <= 99) {
    discount_pct = 0;
  } else if (quantity >= 100 && quantity <= 499) {
    discount_pct = 10;
  } else if (quantity >= 500) {
    discount_pct = 20;
  }

  // Check for rule-based discounts from matching rules (already sorted by priority)
  // Rules are already filtered by conditions, so we just need the first one with a discount
  for (const rule of rules) {
    if (rule.calculations.discount_pct !== undefined) {
      // Only apply if this rule's conditions match the quantity
      if (evaluateRuleConditions(rule, { quantity })) {
        discount_pct = rule.calculations.discount_pct;
        break;
      }
    }
  }

  const discount_amount = subtotal * (discount_pct / 100);
  const final_amount = subtotal - discount_amount;

  return { discount_pct, discount_amount, final_amount };
}

/**
 * Calculate margin and final price
 */
export function calculateMargin(
  cost: number,
  rules: PricingRule[]
): { margin_pct: number; margin_amount: number; total_price: number } {
  // Default margin is 35%
  let margin_pct = 35;

  // Check for rule-based margin
  for (const rule of rules) {
    if (rule.calculations.margin_target !== undefined) {
      margin_pct = rule.calculations.margin_target * 100;
      break;
    }
  }

  const margin_amount = cost * (margin_pct / 100);
  const total_price = cost + margin_amount;

  return { margin_pct, margin_amount, total_price };
}

/**
 * Calculate embroidery pricing based on stitch count
 */
export function calculateEmbroideryPrice(
  stitchCount: number,
  quantity: number,
  rules: PricingRule[]
): number {
  // Default: $1.50 per 1000 stitches
  let pricePerThousand = 1.5;

  // Check for rule-based pricing
  for (const rule of rules) {
    if (rule.calculations.stitch_price_per_1000 !== undefined) {
      pricePerThousand = rule.calculations.stitch_price_per_1000;
      break;
    }
  }

  const thousands = stitchCount / 1000;
  return thousands * pricePerThousand * quantity;
}

/**
 * Main pricing calculation engine
 */
export function calculatePricing(
  input: PricingInput,
  rules: PricingRule[],
  garmentBaseCost: number = 4.5
): PricingOutput {
  const startTime = Date.now();
  const line_items: LineItem[] = [];
  const rulesApplied: string[] = [];

  // Find matching rules
  const matchingRules = findMatchingRules(rules, input);
  matchingRules.forEach(rule => rulesApplied.push(rule.id));

  // 1. Base garment cost
  let baseCost = garmentBaseCost * input.quantity;
  line_items.push({
    description: `Garment x${input.quantity}`,
    unit_cost: garmentBaseCost,
    qty: input.quantity,
    total: baseCost,
  });

  // 2. Print location surcharges
  let locationSurchargeTotal = 0;
  if (input.print_locations && input.print_locations.length > 0) {
    const locationResult = applyLocationSurcharges(
      baseCost,
      input.print_locations,
      matchingRules
    );
    locationSurchargeTotal = locationResult.total * input.quantity;
    
    const locations = input.print_locations.join('+');
    line_items.push({
      description: `Print surcharge (${locations})`,
      unit_cost: locationResult.total,
      qty: input.quantity,
      total: locationSurchargeTotal,
    });
  }

  // 3. Color count multipliers (for screen printing)
  let colorAdjustment = 0;
  if (input.color_count && input.color_count > 1 && input.service === 'screen') {
    const colorResult = applyColorMultiplier(
      baseCost + locationSurchargeTotal,
      input.color_count,
      matchingRules
    );
    colorAdjustment = colorResult.adjustedCost - (baseCost + locationSurchargeTotal);
    line_items.push({
      description: `Color multiplier (${input.color_count}x)`,
      factor: colorResult.multiplier,
      total: colorAdjustment,
    });
  }

  // 4. Embroidery stitch count pricing
  let embroideryPrice = 0;
  if (input.stitch_count && input.service === 'embroidery') {
    embroideryPrice = calculateEmbroideryPrice(
      input.stitch_count,
      input.quantity,
      matchingRules
    );
    line_items.push({
      description: `Embroidery (${input.stitch_count} stitches)`,
      total: embroideryPrice,
    });
  }

  // Calculate subtotal before discount
  const subtotal = baseCost + locationSurchargeTotal + colorAdjustment + embroideryPrice;

  // 5. Volume tier discounts
  const volumeResult = applyVolumeDiscount(subtotal, input.quantity, matchingRules);
  if (volumeResult.discount_pct > 0) {
    line_items.push({
      description: `Volume discount (${input.quantity}+ units)`,
      discount: volumeResult.discount_pct,
      total: -volumeResult.discount_amount,
    });
  }

  // 6. Calculate margin
  const marginResult = calculateMargin(volumeResult.final_amount, matchingRules);

  const endTime = Date.now();

  return {
    line_items,
    subtotal: Number(volumeResult.final_amount.toFixed(2)),
    margin_pct: Number(marginResult.margin_pct.toFixed(1)),
    total_price: Number(marginResult.total_price.toFixed(2)),
    breakdown: {
      base_cost: Number(baseCost.toFixed(2)),
      location_surcharges: Number(locationSurchargeTotal.toFixed(2)),
      color_adjustments: Number(colorAdjustment.toFixed(2)),
      volume_discounts: Number(volumeResult.discount_amount.toFixed(2)),
      margin_amount: Number(marginResult.margin_amount.toFixed(2)),
    },
    rules_applied: rulesApplied,
    calculation_time_ms: endTime - startTime,
  };
}

/**
 * Validate a pricing rule
 */
export function validatePricingRule(rule: Partial<PricingRule>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!rule.id) {
    errors.push('Rule ID is required');
  }

  if (!rule.description) {
    errors.push('Description is required');
  }

  if (rule.version === undefined || rule.version < 1) {
    errors.push('Version must be >= 1');
  }

  if (!rule.effective_date) {
    errors.push('Effective date is required');
  }

  if (!rule.conditions) {
    errors.push('Conditions are required');
  }

  if (!rule.calculations) {
    errors.push('Calculations are required');
  }

  if (rule.priority === undefined) {
    errors.push('Priority is required');
  }

  if (rule.enabled === undefined) {
    errors.push('Enabled flag is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
