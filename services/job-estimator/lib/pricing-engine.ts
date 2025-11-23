export type PricingOptions = {
  service: 'screen' | 'embroidery' | 'laser' | 'transfer';
  colors?: number;
  size?: 'S' | 'M' | 'L' | 'XL' | 'Jumbo';
  // add more fields as required
};

export function calculateBasePrice(quantity: number, opts: PricingOptions) {
  // Very simple placeholder logic to be replaced by sheet-driven rules
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
  }

  // color surcharge
  const colorSurcharge = (opts.colors ?? 1) * 0.5;

  // size multiplier
  const sizeMultiplier = opts.size === 'Jumbo' ? 1.2 : 1.0;

  const price = (base + colorSurcharge) * sizeMultiplier * quantity;
  return Number(price.toFixed(2));
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

export function quoteFromRules(rules: PricingRule[], quantity: number, opts?: Partial<PricingOptions>): { total: number; breakdown: any } {
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

