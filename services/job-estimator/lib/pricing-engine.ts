// ---- Location and Print Placement ----
export type PrintLocation = 'chest' | 'sleeve' | 'full-back' | 'sleeve-combo' | 'back-neck' | 'front';

export type PrintSize = 'S' | 'M' | 'L' | 'XL' | 'Jumbo';

export type RushType = 'standard' | '2-day' | 'next-day' | 'same-day';

export type AddOnType = 'fold' | 'ticket' | 'relabel' | 'hanger';

export const LOCATION_MULTIPLIERS: Record<PrintLocation, number> = {
  'chest': 1.0,
  'sleeve': 1.1,
  'full-back': 1.2,
  'sleeve-combo': 1.25,
  'back-neck': 1.05,
  'front': 1.0,
};

export const PRINT_SIZE_MULTIPLIERS: Record<PrintSize, number> = {
  'S': 0.9,
  'M': 1.0,
  'L': 1.1,
  'XL': 1.2,
  'Jumbo': 1.35,
};

export const RUSH_MULTIPLIERS: Record<RushType, number> = {
  'standard': 1.0,
  '2-day': 1.1,
  'next-day': 1.25,
  'same-day': 1.5,
};

export type PricingOptions = {
  service: 'screen' | 'embroidery' | 'laser' | 'transfer' | 'dtg' | 'sublimation';
  colors?: number;
  size?: PrintSize;
  location?: PrintLocation;
  rush?: RushType;
  addOns?: AddOnType[];
  isNewDesign?: boolean;
};

export function calculateBasePrice(quantity: number, opts: PricingOptions) {
  // Service base pricing
  let base = 0;
  switch (opts.service) {
    case 'screen':
      base = 4.0;
      break;
    case 'embroidery':
      base = 6.0;
      break;
    case 'laser':
      base = 3.5;
      break;
    case 'transfer':
      base = 2.5;
      break;
    case 'dtg':
      base = 5.0;
      break;
    case 'sublimation':
      base = 4.5;
      break;
  }

  // Color surcharge
  const colorSurcharge = (opts.colors ?? 1) * 0.5;

  // Size multiplier (applied to unit price)
  const sizeMultiplier = PRINT_SIZE_MULTIPLIERS[opts.size ?? 'M'];

  // Setup fee (design setup or artwork prep)
  // Based on Excel "Platinum Pricing 35" - setup varies by print size and service
  // A6 (S size) = $27.86, A5 (M) = $34.83, A4 (L) = $41.79, A3 (XL) = $48.76, A2 (Jumbo) = $62.69
  let setupFee = 0;
  if (opts.isNewDesign) {
    const size = opts.size ?? 'M';
    switch (size) {
      case 'S':
        setupFee = 27.86; // A6
        break;
      case 'M':
        setupFee = 34.83; // A5
        break;
      case 'L':
        setupFee = 41.79; // A4
        break;
      case 'XL':
        setupFee = 48.76; // A3
        break;
      case 'Jumbo':
        setupFee = 62.69; // A2
        break;
      default:
        setupFee = 34.83; // Default to A5/M
    }
  }

  // Unit price before quantity/location/rush/addons
  const unitPrice = (base + colorSurcharge) * sizeMultiplier;

  // Subtotal with setup
  const subtotal = unitPrice * quantity + setupFee;

  return {
    unitPrice,
    setupFee,
    subtotal,
    quantity,
  };
}

// ---- Rule extraction and runtime quoting ----
import fs from 'fs';

export type ScreenRow = {
  quantity?: any;
  size?: string | null;
  colors?: any;
  unit_price?: any;
  total_price?: any;
  notes?: string | null;
  [k: string]: any;
};

export type PricingRule = {
  minQty: number;
  maxQty?: number;
  unitPrice: number;
  setupPrice?: number;
  size?: string | null;
  colors?: number | null;
  raw?: ScreenRow;
};

function parseQuantitySpec(q: any): { minQty: number; maxQty?: number } {
  // Expect formats like: "1-24", "25+", or single numbers
  if (q === null || q === undefined) {
    return { minQty: 1 } as any;
  }
  const s = String(q).trim();
  if (s.includes('-')) {
    const parts = s.split('-').map(p => p.trim());
    const minQ = parseInt(parts[0], 10);
    const maxQ = parseInt(parts[1], 10);
    return { minQty: Number.isNaN(minQ) ? 1 : minQ, maxQty: Number.isNaN(maxQ) ? undefined : maxQ };
  }
  if (s.endsWith('+')) {
    const n = parseInt(s.slice(0, -1), 10);
    return { minQty: Number.isNaN(n) ? 1 : n };
  }
  const n = parseInt(s, 10);
  if (!Number.isNaN(n)) return { minQty: n, maxQty: n };
  return { minQty: 1 };
}

function toNumber(v: any): number | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[^0-9.\-]/g, '').trim();
  if (s === '') return undefined;
  const n = Number(s);
  return isNaN(n) ? undefined : n;
}

export function loadScreenPricingRules(jsonPath: string): PricingRule[] {
  if (!fs.existsSync(jsonPath)) return [];
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as ScreenRow[];
  const rules: PricingRule[] = [];
  for (const row of raw) {
    const qtySpec = parseQuantitySpec(row.quantity ?? row.Quantity ?? row.quantity_range ?? row['Quantity Range']);
    const unit = toNumber(row.unit_price ?? row['Unit Price'] ?? row.unit_price_usd ?? row['Unit']) ?? 0;
    const setup = toNumber(row.setup_price ?? row['Setup Price'] ?? row.setup) ?? 0;
    const colors = row.colors ?? row.Colors ?? null;
    const size = row.size ?? row.Size ?? null;
    rules.push({ minQty: qtySpec.minQty, maxQty: qtySpec.maxQty, unitPrice: unit, setupPrice: setup, colors: toNumber(colors) ?? null, size: size, raw: row });
  }
  // sort by minQty
  rules.sort((a, b) => a.minQty - b.minQty);
  return rules;
}

export function quoteFromRules(rules: PricingRule[], quantity: number, _opts?: Partial<PricingOptions>): { total: number; breakdown: any } {
  // Find best-matching rule for quantity (highest minQty <= quantity)
  let candidate: PricingRule | undefined;
  for (const r of rules) {
    if (r.minQty <= quantity && (r.maxQty === undefined || quantity <= r.maxQty)) {
      candidate = r;
      break;
    }
  }
  if (!candidate) {
    candidate = rules[rules.length - 1];
  }
  const unit = candidate.unitPrice;
  const setup = candidate.setupPrice ?? 0;
  const total = unit * quantity + setup;
  return { total: Number(total.toFixed(2)), breakdown: { unit, quantity, setup } };
}

