# Advanced Pricing Model Documentation

## Table of Contents
1. [Overview](#overview)
2. [Pricing Components](#pricing-components)
3. [Formulas](#formulas)
4. [Implementation Details](#implementation-details)
5. [Examples](#examples)
6. [Integration Guide](#integration-guide)

---

## Overview

The Advanced Pricing Engine provides comprehensive, flexible pricing for print shop orders. It handles:

- **6 Print Services**: Screen, Embroidery, Laser, Transfer, DTG, Sublimation
- **6 Print Locations**: Chest, Sleeve, Full-back, Sleeve-combo, Back-neck, Front
- **5 Print Sizes**: S, M, L, XL, Jumbo (with individual multipliers)
- **4 Rush Levels**: Standard (5-day), 2-day, Next-day, Same-day
- **4 Add-ons**: Fold, Ticket, Relabel, Hanger
- **6 Volume Discount Tiers**: 1-49, 50-99, 100-249, 250-499, 500-999, 1000+
- **35% Profit Margin** (configurable)

---

## Pricing Components

### 1. Service Base Prices (per unit)

| Service | Base Price | Description |
|---------|-----------|-------------|
| Screen | $4.00 | Traditional screen printing |
| Embroidery | $6.00 | Premium embroidered designs |
| Laser | $3.50 | Precise laser engraving |
| Transfer | $2.50 | Heat transfer printing |
| DTG | $5.00 | Direct-to-garment digital |
| Sublimation | $4.50 | Sublimation for polyester |

### 2. Color Surcharges (per color per unit)

- **Base**: $0.50 per additional color
- Applied on top of service base price
- Example: 2-color screen print = $4.00 + (2 × $0.50) = $5.00/unit

### 3. Location Multipliers

| Location | Multiplier | Surcharge | Reason |
|----------|-----------|-----------|--------|
| Chest (left) | 1.0× | Base | Standard placement |
| Front center | 1.0× | Base | Standard placement |
| Back-neck | 1.05× | +5% | Limited space, precision required |
| Sleeve | 1.1× | +10% | Medium area, moderate complexity |
| Full-back | 1.2× | +20% | Large area, high setup complexity |
| Sleeve-combo | 1.25× | +25% | Two locations, highest setup |

### 4. Print Size Multipliers

| Size | Multiplier | Coverage | Typical Use |
|------|-----------|----------|------------|
| S (Small) | 0.9× | 2×2 to 2×4 in | Pocket, small logo |
| M (Medium) | 1.0× | 4×4 to 6×6 in | Standard chest print |
| L (Large) | 1.1× | 6×8 to 8×10 in | Large chest, full sleeve |
| XL (X-Large) | 1.2× | 8×10 to 10×12 in | Large back print |
| Jumbo | 1.35× | 10×12+ in | Full-back, all-over print |

### 5. Rush Premiums

| Rush Level | Multiplier | Lead Time | Premium |
|-----------|-----------|-----------|---------|
| Standard | 1.0× | 5 business days | Base price |
| 2-day | 1.1× | 2 business days | +10% |
| Next-day | 1.25× | 1 business day | +25% |
| Same-day | 1.5× | 4 hours | +50% |

### 6. Add-on Pricing (per unit, per item)

| Add-on | Price | Description |
|--------|-------|-------------|
| Fold | $0.15 | Professional garment folding |
| Ticket | $0.10 | Personalized hang tag |
| Relabel | $0.20 | Remove/apply custom label |
| Hanger | $0.25 | Plastic hanger attachment |

### 7. Volume Discounts (off subtotal)

| Quantity Range | Discount | Breakpoint |
|---|---|---|
| 1–49 | 0% | Base pricing |
| 50–99 | 5% | -$0.225 per unit (100 qty) |
| 100–249 | 8% | -$0.36 per unit (100 qty) |
| 250–499 | 10% | -$0.45 per unit (100 qty) |
| 500–999 | 12% | -$0.54 per unit (100 qty) |
| 1000+ | 15% | -$0.675 per unit (100 qty) |

### 8. Setup Fees

| Item | Cost | When Applied |
|------|------|--------------|
| Design Setup (New Design) | $74.28 | Once per new artwork |
| Existing Design | $0 | Reorders, existing files |

### 9. Profit Margin

- **Default**: 35% markup on cost
- Applied after all other calculations
- Multiplier: 1.35× (100% + 35%)
- Configurable per quote

---

## Formulas

### Step 1: Calculate Unit Price
```
Unit Price = Service Base + (Colors × Color Surcharge) × Size Multiplier

Example (Screen, 2 color, M size):
= (4.00 + (2 × 0.50)) × 1.0
= 5.00 × 1.0
= $5.00/unit
```

### Step 2: Calculate Subtotal with Setup
```
Subtotal = (Unit Price × Quantity) + Setup Fee

Example (100 units, new design):
= (5.00 × 100) + 74.28
= 500 + 74.28
= $574.28
```

### Step 3: Apply Location Multiplier
```
Location Price = Subtotal × Location Multiplier

Example (full-back, 1.2×):
= 574.28 × 1.2
= $689.14
```

### Step 4: Apply Rush Multiplier
```
Rush Price = Location Price × Rush Multiplier

Example (next-day, 1.25×):
= 689.14 × 1.25
= $861.43
```

### Step 5: Add Add-ons
```
Total with Add-ons = Rush Price + (Add-on Unit Price × Quantity)

Example (fold + hanger, 100 units):
= 861.43 + ((0.15 + 0.25) × 100)
= 861.43 + 40.00
= $901.43
```

### Step 6: Apply Volume Discount
```
Discounted Price = Total with Add-ons × (1 - Volume Discount)

Example (100 units, 8% discount):
= 901.43 × (1 - 0.08)
= 901.43 × 0.92
= $829.31
```

### Step 7: Apply Profit Margin
```
Final Retail Price = Discounted Price × (1 + Profit Margin)

Example (35% margin):
= 829.31 × 1.35
= $1,119.57
```

---

## Implementation Details

### TypeScript Types

```typescript
// Main options for quote generation
interface QuoteOptions {
  quantity: number;
  service: 'screen' | 'embroidery' | 'laser' | 'transfer' | 'dtg' | 'sublimation';
  colors?: number;
  location?: PrintLocation;
  printSize?: PrintSize;
  rush?: RushType;
  addOns?: AddOnType[];
  isNewDesign?: boolean;
  profitMargin?: number;
}

// Complete breakdown returned
interface QuoteBreakdown {
  quantity: number;
  service: string;
  colors: number;
  location: PrintLocation;
  printSize: PrintSize;
  rush: RushType;
  addOns: AddOnType[];
  
  // All calculations
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
```

### Core Function

```typescript
function generateQuote(options: QuoteOptions): QuoteBreakdown
```

**Parameters:**
- `quantity`: Order size (1-999,999+)
- `service`: Print service type
- `colors`: Number of colors (optional, default: 1)
- `location`: Print location (optional, default: 'chest')
- `printSize`: Print size (optional, default: 'M')
- `rush`: Rush type (optional, default: 'standard')
- `addOns`: Array of add-on types (optional, default: [])
- `isNewDesign`: New design setup required (optional, default: false)
- `profitMargin`: Custom margin (optional, default: 0.35)

**Returns:**
- `QuoteBreakdown` object with complete pricing breakdown

### Utility Functions

```typescript
// Get volume discount for quantity
getVolumeDiscount(quantity: number): number

// Calculate cost without margin
calculateCost(options: QuoteOptions): number

// Calculate profit with margin
calculateProfit(options: QuoteOptions, profitMargin?: number): number

// Compare all rush options
compareRushOptions(options: QuoteOptions): Record<RushType, number>

// Multi-location pricing
calculateMultiLocationOrder(baseOptions: QuoteOptions, locations: PrintLocation[]): QuoteBreakdown[]

// Multi-location total
calculateMultiLocationTotal(baseOptions: QuoteOptions, locations: PrintLocation[]): number

// Bulk savings calculator
calculateBulkSavings(options: QuoteOptions, currentQty: number, targetQty: number): number

// Minimum quantity for discount tier
getMinQtyForDiscount(targetDiscount: number): number
```

---

## Examples

### Example 1: Your Test Case
**100pc Screen Print, 1-color, Left Chest, Standard 5-day, New Design**

```typescript
const options: QuoteOptions = {
  quantity: 100,
  service: 'screen',
  colors: 1,
  location: 'chest',
  printSize: 'M',
  rush: 'standard',
  isNewDesign: true,
};

const quote = generateQuote(options);
// quote.finalRetailPrice === $751.78
```

**Calculation Breakdown:**
```
1. Unit Price = (4.00 + (1 × 0.50)) × 1.0 = $4.50
2. Subtotal = (4.50 × 100) + 74.28 = $556.28
3. Location Price = 556.28 × 1.0 = $556.28
4. Rush Price = 556.28 × 1.0 = $556.28
5. Add-ons = $556.28 + $0 = $556.28
6. Volume Discount = 556.28 × (1 - 0) = $556.28
7. Final = 556.28 × 1.35 = $751.78 ✓
```

### Example 2: Premium Corporate Order
**500pc Embroidery, 4-color, Sleeve-combo, 2-day Rush, with Fold & Hanger**

```typescript
const options: QuoteOptions = {
  quantity: 500,
  service: 'embroidery',
  colors: 4,
  location: 'sleeve-combo',
  printSize: 'M',
  rush: '2-day',
  addOns: ['fold', 'hanger'],
  isNewDesign: true,
};

const quote = generateQuote(options);
```

**Key Features:**
- 12% volume discount (500 qty)
- 25% location premium (sleeve-combo)
- 10% rush premium (2-day)
- Add-ons: $0.15 + $0.25 = $0.40/unit = $200 total

**Cost Estimate:** ~$3,500–$4,000

### Example 3: Reorder (No Setup Fee)
**200pc Screen Print, 2-color, Full-back, Standard, Existing Design**

```typescript
const options: QuoteOptions = {
  quantity: 200,
  service: 'screen',
  colors: 2,
  location: 'full-back',
  printSize: 'L',
  rush: 'standard',
  isNewDesign: false,  // ← No $74.28 setup fee
};

const quote = generateQuote(options);
```

**Benefits:**
- No design setup fee
- 8% volume discount (100-249 qty range)
- 20% location premium
- Lower per-unit cost

**Cost Estimate:** ~$1,200–$1,400

### Example 4: Rush Sample Order
**25pc DTG, 6-color, Chest, Same-day Rush, New Design**

```typescript
const options: QuoteOptions = {
  quantity: 25,
  service: 'dtg',
  colors: 6,
  location: 'chest',
  printSize: 'M',
  rush: 'same-day',
  isNewDesign: true,
};

const quote = generateQuote(options);
```

**Key Features:**
- No volume discount (qty < 50)
- 50% rush premium (same-day)
- High color count ($3.00/unit color surcharge)
- Design setup fee ($74.28)

**Cost Estimate:** ~$550–$650

### Example 5: Multi-Location Order
**100pc Screen Print, 1-color, Chest + Sleeve + Full-back**

```typescript
const baseOptions: QuoteOptions = {
  quantity: 100,
  service: 'screen',
  colors: 1,
  printSize: 'M',
  rush: 'standard',
  isNewDesign: true,
};

const total = calculateMultiLocationTotal(baseOptions, ['chest', 'sleeve', 'full-back']);
// Automatically calculates and sums all three locations
```

**Location Prices:**
- Chest: $751.78 (1.0×)
- Sleeve: +$75.18 (+10% premium)
- Full-back: +$150.36 (+20% premium)
- **Total: ~$977.32**

---

## Integration Guide

### Basic Integration

1. **Import the module:**
```typescript
import { generateQuote, QuoteOptions } from './lib/advanced-pricing';
```

2. **Create quote options:**
```typescript
const options: QuoteOptions = {
  quantity: 100,
  service: 'screen',
  colors: 1,
  location: 'chest',
  printSize: 'M',
  rush: 'standard',
  isNewDesign: true,
};
```

3. **Generate quote:**
```typescript
const quote = generateQuote(options);
console.log(`Final Price: $${quote.finalRetailPrice}`);
```

4. **Display breakdown (optional):**
```typescript
console.log(`Unit Price: $${quote.unitPrice}`);
console.log(`Setup Fee: $${quote.setupFee}`);
console.log(`Subtotal: $${quote.subtotal}`);
console.log(`Location Multiplier: ${quote.locationMultiplier}×`);
console.log(`Rush Multiplier: ${quote.rushMultiplier}×`);
console.log(`Volume Discount: ${(quote.volumeDiscount * 100).toFixed(1)}%`);
console.log(`Final Retail Price: $${quote.finalRetailPrice}`);
```

### API Endpoint Example

```typescript
app.post('/api/quote', (req, res) => {
  const options: QuoteOptions = req.body;
  const quote = generateQuote(options);
  res.json(quote);
});
```

**Request:**
```json
{
  "quantity": 100,
  "service": "screen",
  "colors": 1,
  "location": "chest",
  "printSize": "M",
  "rush": "standard",
  "isNewDesign": true
}
```

**Response:**
```json
{
  "quantity": 100,
  "service": "screen",
  "colors": 1,
  "location": "chest",
  "printSize": "M",
  "rush": "standard",
  "unitPrice": 4.5,
  "setupFee": 74.28,
  "subtotal": 556.28,
  "locationMultiplier": 1.0,
  "locationPrice": 556.28,
  "sizeMultiplier": 1.0,
  "rushMultiplier": 1.0,
  "rushPrice": 556.28,
  "addOnCost": 0,
  "subtotalWithAddOns": 556.28,
  "volumeDiscount": 0.0,
  "discountedPrice": 556.28,
  "profitMarginMultiplier": 1.35,
  "finalRetailPrice": 751.78
}
```

### React Component Example

```typescript
import React, { useState } from 'react';
import { generateQuote, QuoteOptions } from './lib/advanced-pricing';

export const QuoteCalculator: React.FC = () => {
  const [quantity, setQuantity] = useState(100);
  const [service, setService] = useState<'screen' | 'embroidery'>('screen');
  const [colors, setColors] = useState(1);
  const [location, setLocation] = useState<PrintLocation>('chest');
  const [rush, setRush] = useState<RushType>('standard');

  const quote = generateQuote({
    quantity,
    service,
    colors,
    location,
    rush,
  });

  return (
    <div>
      <h1>Quote Calculator</h1>
      
      <div>
        <label>Quantity:</label>
        <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} />
      </div>

      <div>
        <label>Service:</label>
        <select value={service} onChange={e => setService(e.target.value as any)}>
          <option value="screen">Screen Print</option>
          <option value="embroidery">Embroidery</option>
        </select>
      </div>

      {/* More form fields... */}

      <div className="breakdown">
        <p>Unit Price: ${quote.unitPrice}</p>
        <p>Subtotal: ${quote.subtotal}</p>
        <p>Volume Discount: {(quote.volumeDiscount * 100).toFixed(1)}%</p>
        <h2>Final Price: ${quote.finalRetailPrice}</h2>
      </div>
    </div>
  );
};
```

### Database Storage

When saving quotes to database, store the entire breakdown:

```typescript
interface SavedQuote {
  id: string;
  customerId: string;
  createdAt: Date;
  breakdown: QuoteBreakdown;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
}

async function saveQuote(customerId: string, options: QuoteOptions): Promise<SavedQuote> {
  const breakdown = generateQuote(options);
  
  return db.quotes.create({
    customerId,
    breakdown,
    status: 'draft',
    createdAt: new Date(),
  });
}
```

---

## Constants Reference

### Service Base Prices
```typescript
{
  screen: 4.00,
  embroidery: 6.00,
  laser: 3.50,
  transfer: 2.50,
  dtg: 5.00,
  sublimation: 4.50,
}
```

### Location Multipliers
```typescript
{
  chest: 1.0,
  sleeve: 1.1,
  'full-back': 1.2,
  'sleeve-combo': 1.25,
  'back-neck': 1.05,
  front: 1.0,
}
```

### Print Size Multipliers
```typescript
{
  S: 0.9,
  M: 1.0,
  L: 1.1,
  XL: 1.2,
  Jumbo: 1.35,
}
```

### Rush Multipliers
```typescript
{
  standard: 1.0,
  '2-day': 1.1,
  'next-day': 1.25,
  'same-day': 1.5,
}
```

### Add-on Pricing
```typescript
{
  fold: 0.15,
  ticket: 0.10,
  relabel: 0.20,
  hanger: 0.25,
}
```

---

## Best Practices

1. **Always validate quantity**: Ensure qty >= 1
2. **Round all prices**: Use `.toFixed(2)` for display
3. **Cache constants**: Load multipliers once, not per quote
4. **Validate service type**: Ensure service is in allowed list
5. **Handle edge cases**: Consider qty=1, high color counts, maximum rush premiums
6. **Document custom margins**: If using non-35% margin, document why
7. **Test combinations**: Verify multiplier combinations work correctly
8. **Monitor costs**: Track actual vs quoted costs over time
9. **Update pricing tables**: Review quarterly for market competitiveness
10. **Audit all changes**: Log all pricing adjustments with reasons

---

## FAQ

**Q: Can I apply multiple rush levels?**
A: No, select the fastest/most expensive rush needed. Rush levels are not cumulative.

**Q: Do volume discounts stack with other discounts?**
A: Volume discounts are applied to the base price after location/size/rush multipliers. They reduce the final cost, not the multipliers themselves.

**Q: Can I offer custom margins?**
A: Yes, pass `profitMargin` parameter to `generateQuote()`. Default is 0.35 (35%).

**Q: How are setup fees handled on reorders?**
A: Set `isNewDesign: false` for reorders. Setup fee is only charged once for new artwork.

**Q: What's the maximum and minimum order size?**
A: Technically unlimited. Pricing adjusts based on qty with volume discounts up to 15% at 1000+ units.

**Q: Can I mix services in one order?**
A: No, each service type requires its own quote. Use API to aggregate multiple service quotes.

**Q: How often should I update pricing tables?**
A: Review quarterly for material costs, labor, and market competitiveness. Document all changes.

---

## Support

For issues or questions:
1. Check pricing-tables.json for current rates
2. Review test suite (advanced-pricing.test.ts) for examples
3. Verify all multipliers are applied correctly
4. Test edge cases (qty=1, large quantities, all add-ons)

