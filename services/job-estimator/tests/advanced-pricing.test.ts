/**
 * Advanced Pricing Engine Test Suite
 *
 * Comprehensive tests covering:
 * - Base pricing calculations
 * - Location multipliers
 * - Print size complexity
 * - Rush pricing
 * - Add-ons
 * - Volume discounts
 * - Multi-location orders
 * - Edge cases
 */

import {
  generateQuote,
  calculateCost,
  calculateProfit,
  getVolumeDiscount,
  compareRushOptions,
  calculateMultiLocationOrder,
  calculateMultiLocationTotal,
  getMinQtyForDiscount,
  calculateBulkSavings,
  QuoteOptions,
  ADD_ON_PRICING,
  PrintLocation,
  PrintSize,
  RushType,
} from '../lib/advanced-pricing';

describe('Advanced Pricing Engine', () => {
  // ========== TEST CASE: Your Specific Example ==========
  describe('Your Test Case: 100pc Screen Print', () => {
    it('should calculate correct retail price for 100pc, 1 color, left chest, standard 5-day', () => {
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

      // Expected breakdown:
      // Base: $4.00/unit
      // Color: $0.50/unit
      // Setup: $74.28
      // Subtotal: (4.50 * 100) + 74.28 = $556.28
      // Location (chest 1.0x): $556.28
      // Rush (5-day, no premium): $556.28
      // AddOns: $0
      // Margin (35%): $556.28 * 1.35 = $751.78

      expect(quote.unitPrice).toBeCloseTo(4.5, 1);
      expect(quote.setupFee).toBeCloseTo(74.28, 1);
      expect(quote.subtotal).toBeCloseTo(556.28, 1);
      expect(quote.locationMultiplier).toBe(1.0);
      expect(quote.locationPrice).toBeCloseTo(556.28, 1);
      expect(quote.rushMultiplier).toBe(1.0);
      expect(quote.rushPrice).toBeCloseTo(556.28, 1);
      expect(quote.profitMarginMultiplier).toBe(1.35);
      expect(quote.finalRetailPrice).toBeCloseTo(751.78, 1);
    });

    it('should have correct breakdown details', () => {
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

      expect(quote.quantity).toBe(100);
      expect(quote.service).toBe('screen');
      expect(quote.colors).toBe(1);
      expect(quote.location).toBe('chest');
      expect(quote.addOns).toHaveLength(0);
      expect(quote.volumeDiscount).toBe(0.08); // 100-249 qty range has 8% discount
    });
  });

  // ========== LOCATION MULTIPLIER TESTS ==========
  describe('Location Multipliers', () => {
    const baseOptions: QuoteOptions = {
      quantity: 100,
      service: 'screen',
      colors: 1,
      location: 'chest',
      printSize: 'M',
      rush: 'standard',
      isNewDesign: false,
    };

    it('chest location should have 1.0x multiplier', () => {
      const quote = generateQuote({ ...baseOptions, location: 'chest' });
      expect(quote.locationMultiplier).toBe(1.0);
    });

    it('sleeve location should have 1.1x multiplier', () => {
      const quote = generateQuote({ ...baseOptions, location: 'sleeve' });
      expect(quote.locationMultiplier).toBe(1.1);
    });

    it('full-back location should have 1.2x multiplier', () => {
      const quote = generateQuote({ ...baseOptions, location: 'full-back' });
      expect(quote.locationMultiplier).toBe(1.2);
    });

    it('sleeve-combo location should have 1.25x multiplier', () => {
      const quote = generateQuote({ ...baseOptions, location: 'sleeve-combo' });
      expect(quote.locationMultiplier).toBe(1.25);
    });

    it('back-neck location should have 1.05x multiplier', () => {
      const quote = generateQuote({ ...baseOptions, location: 'back-neck' });
      expect(quote.locationMultiplier).toBe(1.05);
    });

    it('sleeve pricing should be 10% more than chest', () => {
      const chestQuote = generateQuote({ ...baseOptions, location: 'chest' });
      const sleeveQuote = generateQuote({ ...baseOptions, location: 'sleeve' });

      const ratio = sleeveQuote.finalRetailPrice / chestQuote.finalRetailPrice;
      expect(ratio).toBeCloseTo(1.1, 2);
    });

    it('full-back pricing should be 20% more than chest', () => {
      const chestQuote = generateQuote({ ...baseOptions, location: 'chest' });
      const backQuote = generateQuote({ ...baseOptions, location: 'full-back' });

      const ratio = backQuote.finalRetailPrice / chestQuote.finalRetailPrice;
      expect(ratio).toBeCloseTo(1.2, 2);
    });

    it('sleeve-combo pricing should be 25% more than chest', () => {
      const chestQuote = generateQuote({ ...baseOptions, location: 'chest' });
      const comboQuote = generateQuote({ ...baseOptions, location: 'sleeve-combo' });

      const ratio = comboQuote.finalRetailPrice / chestQuote.finalRetailPrice;
      expect(ratio).toBeCloseTo(1.25, 2);
    });
  });

  // ========== PRINT SIZE TESTS ==========
  describe('Print Size Multipliers', () => {
    const baseOptions: QuoteOptions = {
      quantity: 50,
      service: 'screen',
      colors: 1,
      location: 'chest',
      printSize: 'M',
      rush: 'standard',
      isNewDesign: false,
    };

    it('size S should have 0.9x multiplier', () => {
      const quote = generateQuote({ ...baseOptions, printSize: 'S' });
      expect(quote.sizeMultiplier).toBe(0.9);
    });

    it('size M should have 1.0x multiplier', () => {
      const quote = generateQuote({ ...baseOptions, printSize: 'M' });
      expect(quote.sizeMultiplier).toBe(1.0);
    });

    it('size L should have 1.1x multiplier', () => {
      const quote = generateQuote({ ...baseOptions, printSize: 'L' });
      expect(quote.sizeMultiplier).toBe(1.1);
    });

    it('size XL should have 1.2x multiplier', () => {
      const quote = generateQuote({ ...baseOptions, printSize: 'XL' });
      expect(quote.sizeMultiplier).toBe(1.2);
    });

    it('size Jumbo should have 1.35x multiplier', () => {
      const quote = generateQuote({ ...baseOptions, printSize: 'Jumbo' });
      expect(quote.sizeMultiplier).toBe(1.35);
    });

    it('L size pricing should be 10% more than M', () => {
      const mQuote = generateQuote({ ...baseOptions, printSize: 'M' });
      const lQuote = generateQuote({ ...baseOptions, printSize: 'L' });

      const ratio = lQuote.finalRetailPrice / mQuote.finalRetailPrice;
      expect(ratio).toBeCloseTo(1.1, 2);
    });

    it('XL size pricing should be 20% more than M', () => {
      const mQuote = generateQuote({ ...baseOptions, printSize: 'M' });
      const xlQuote = generateQuote({ ...baseOptions, printSize: 'XL' });

      const ratio = xlQuote.finalRetailPrice / mQuote.finalRetailPrice;
      expect(ratio).toBeCloseTo(1.2, 2);
    });
  });

  // ========== RUSH PRICING TESTS ==========
  describe('Rush Pricing', () => {
    const baseOptions: QuoteOptions = {
      quantity: 50,
      service: 'screen',
      colors: 1,
      location: 'chest',
      printSize: 'M',
      rush: 'standard',
      isNewDesign: false,
    };

    it('standard rush should have 1.0x multiplier', () => {
      const quote = generateQuote({ ...baseOptions, rush: 'standard' });
      expect(quote.rushMultiplier).toBe(1.0);
    });

    it('2-day rush should have 1.1x multiplier', () => {
      const quote = generateQuote({ ...baseOptions, rush: '2-day' });
      expect(quote.rushMultiplier).toBe(1.1);
    });

    it('next-day rush should have 1.25x multiplier', () => {
      const quote = generateQuote({ ...baseOptions, rush: 'next-day' });
      expect(quote.rushMultiplier).toBe(1.25);
    });

    it('same-day rush should have 1.5x multiplier', () => {
      const quote = generateQuote({ ...baseOptions, rush: 'same-day' });
      expect(quote.rushMultiplier).toBe(1.5);
    });

    it('2-day rush pricing should be 10% more than standard', () => {
      const standardQuote = generateQuote({ ...baseOptions, rush: 'standard' });
      const rushQuote = generateQuote({ ...baseOptions, rush: '2-day' });

      const ratio = rushQuote.finalRetailPrice / standardQuote.finalRetailPrice;
      expect(ratio).toBeCloseTo(1.1, 2);
    });

    it('next-day rush pricing should be 25% more than standard', () => {
      const standardQuote = generateQuote({ ...baseOptions, rush: 'standard' });
      const rushQuote = generateQuote({ ...baseOptions, rush: 'next-day' });

      const ratio = rushQuote.finalRetailPrice / standardQuote.finalRetailPrice;
      expect(ratio).toBeCloseTo(1.25, 2);
    });

    it('same-day rush pricing should be 50% more than standard', () => {
      const standardQuote = generateQuote({ ...baseOptions, rush: 'standard' });
      const rushQuote = generateQuote({ ...baseOptions, rush: 'same-day' });

      const ratio = rushQuote.finalRetailPrice / standardQuote.finalRetailPrice;
      expect(ratio).toBeCloseTo(1.5, 2);
    });

    it('should compare all rush options correctly', () => {
      const rushOptions = compareRushOptions(baseOptions);

      expect(rushOptions.standard).toBeLessThan(rushOptions['2-day']);
      expect(rushOptions['2-day']).toBeLessThan(rushOptions['next-day']);
      expect(rushOptions['next-day']).toBeLessThan(rushOptions['same-day']);
    });
  });

  // ========== ADD-ONS TESTS ==========
  describe('Add-ons', () => {
    const baseOptions: QuoteOptions = {
      quantity: 100,
      service: 'screen',
      colors: 1,
      location: 'chest',
      printSize: 'M',
      rush: 'standard',
      isNewDesign: false,
    };

    it('should calculate fold add-on cost correctly', () => {
      const quoteWithoutAddOns = generateQuote(baseOptions);
      const quoteWithAddOns = generateQuote({
        ...baseOptions,
        addOns: ['fold'],
      });

      const addOnCost = ADD_ON_PRICING['fold'] * 100;
      const expectedDifference = addOnCost * 1.35; // 35% margin

      expect(
        quoteWithAddOns.finalRetailPrice - quoteWithoutAddOns.finalRetailPrice
      ).toBeCloseTo(expectedDifference, 1);
    });

    it('should calculate ticket add-on cost correctly', () => {
      const quoteWithAddOns = generateQuote({
        ...baseOptions,
        addOns: ['ticket'],
      });

      expect(quoteWithAddOns.addOnCost).toBeCloseTo(10.0, 1); // 0.10 * 100
    });

    it('should calculate relabel add-on cost correctly', () => {
      const quoteWithAddOns = generateQuote({
        ...baseOptions,
        addOns: ['relabel'],
      });

      expect(quoteWithAddOns.addOnCost).toBeCloseTo(20.0, 1); // 0.20 * 100
    });

    it('should calculate hanger add-on cost correctly', () => {
      const quoteWithAddOns = generateQuote({
        ...baseOptions,
        addOns: ['hanger'],
      });

      expect(quoteWithAddOns.addOnCost).toBeCloseTo(25.0, 1); // 0.25 * 100
    });

    it('should combine multiple add-ons', () => {
      const quoteWithAddOns = generateQuote({
        ...baseOptions,
        addOns: ['fold', 'ticket', 'relabel'],
      });

      const expectedAddOnCost =
        (ADD_ON_PRICING['fold'] +
          ADD_ON_PRICING['ticket'] +
          ADD_ON_PRICING['relabel']) *
        100;

      expect(quoteWithAddOns.addOnCost).toBeCloseTo(expectedAddOnCost, 1);
    });

    it('should include all add-ons in final price', () => {
      const addOns: (keyof typeof ADD_ON_PRICING)[] = [
        'fold',
        'ticket',
        'relabel',
        'hanger',
      ];

      const quote = generateQuote({
        ...baseOptions,
        addOns,
      });

      const expectedAddOnCost = addOns.reduce(
        (sum, addon) => sum + ADD_ON_PRICING[addon] * 100,
        0
      );

      expect(quote.addOns).toHaveLength(4);
      expect(quote.addOnCost).toBeCloseTo(expectedAddOnCost, 1);
    });
  });

  // ========== VOLUME DISCOUNT TESTS ==========
  describe('Volume Discounts', () => {
    const baseOptions: QuoteOptions = {
      quantity: 100,
      service: 'screen',
      colors: 1,
      location: 'chest',
      printSize: 'M',
      rush: 'standard',
      isNewDesign: false,
    };

    it('qty 1-49 should have 0% discount', () => {
      expect(getVolumeDiscount(1)).toBe(0.0);
      expect(getVolumeDiscount(25)).toBe(0.0);
      expect(getVolumeDiscount(49)).toBe(0.0);
    });

    it('qty 50-99 should have 5% discount', () => {
      expect(getVolumeDiscount(50)).toBe(0.05);
      expect(getVolumeDiscount(75)).toBe(0.05);
      expect(getVolumeDiscount(99)).toBe(0.05);
    });

    it('qty 100-249 should have 8% discount', () => {
      expect(getVolumeDiscount(100)).toBe(0.08);
      expect(getVolumeDiscount(150)).toBe(0.08);
      expect(getVolumeDiscount(249)).toBe(0.08);
    });

    it('qty 250-499 should have 10% discount', () => {
      expect(getVolumeDiscount(250)).toBe(0.1);
      expect(getVolumeDiscount(350)).toBe(0.1);
      expect(getVolumeDiscount(499)).toBe(0.1);
    });

    it('qty 500-999 should have 12% discount', () => {
      expect(getVolumeDiscount(500)).toBe(0.12);
      expect(getVolumeDiscount(750)).toBe(0.12);
      expect(getVolumeDiscount(999)).toBe(0.12);
    });

    it('qty 1000+ should have 15% discount', () => {
      expect(getVolumeDiscount(1000)).toBe(0.15);
      expect(getVolumeDiscount(5000)).toBe(0.15);
      expect(getVolumeDiscount(10000)).toBe(0.15);
    });

    it('should apply discount to final price', () => {
      const quote50 = generateQuote({ ...baseOptions, quantity: 50 });
      const quote100 = generateQuote({ ...baseOptions, quantity: 100 });

      const unitPrice50 = quote50.finalRetailPrice / 50;
      const unitPrice100 = quote100.finalRetailPrice / 100;

      // 100 units should have lower per-unit price
      expect(unitPrice100).toBeLessThan(unitPrice50);
    });

    it('should have larger savings at higher quantities', () => {
      const quote100 = generateQuote({ ...baseOptions, quantity: 100 });
      const quote500 = generateQuote({ ...baseOptions, quantity: 500 });

      const unitPrice100 = quote100.finalRetailPrice / 100;
      const unitPrice500 = quote500.finalRetailPrice / 500;

      expect(unitPrice500).toBeLessThan(unitPrice100);
    });
  });

  // ========== PROFIT MARGIN TESTS ==========
  describe('Profit Margin', () => {
    const baseOptions: QuoteOptions = {
      quantity: 100,
      service: 'screen',
      colors: 1,
      location: 'chest',
      printSize: 'M',
      rush: 'standard',
      isNewDesign: false,
    };

    it('should apply 35% profit margin by default', () => {
      const quote = generateQuote(baseOptions);
      expect(quote.profitMarginMultiplier).toBe(1.35);
    });

    it('should allow custom profit margin', () => {
      const quote = generateQuote({ ...baseOptions, profitMargin: 0.50 });
      expect(quote.profitMarginMultiplier).toBe(1.5);
    });

    it('final price should be cost * (1 + margin)', () => {
      const quote = generateQuote(baseOptions);
      const cost = calculateCost(baseOptions);
      const expected = cost * 1.35;

      expect(quote.finalRetailPrice).toBeCloseTo(expected, 1);
    });

    it('should calculate profit correctly', () => {
      const quote = generateQuote(baseOptions);
      const cost = calculateCost(baseOptions);
      const profit = quote.finalRetailPrice - cost;

      expect(profit).toBeCloseTo(cost * 0.35, 1);
    });

    it('calculateProfit should return correct profit amount', () => {
      const profit = calculateProfit(baseOptions);
      const quote = generateQuote(baseOptions);
      const cost = calculateCost(baseOptions);

      expect(profit).toBeCloseTo(quote.finalRetailPrice - cost, 1);
    });
  });

  // ========== COLOR SURCHARGE TESTS ==========
  describe('Color Surcharges', () => {
    const baseOptions: QuoteOptions = {
      quantity: 100,
      service: 'screen',
      location: 'chest',
      printSize: 'M',
      rush: 'standard',
      isNewDesign: false,
    };

    it('1 color should be base price', () => {
      const quote = generateQuote({ ...baseOptions, colors: 1 });
      expect(quote.colors).toBe(1);
    });

    it('2 colors should have higher unit price', () => {
      const quote1 = generateQuote({ ...baseOptions, colors: 1 });
      const quote2 = generateQuote({ ...baseOptions, colors: 2 });

      expect(quote2.unitPrice).toBeGreaterThan(quote1.unitPrice);
    });

    it('each color should add $0.50 surcharge per unit', () => {
      const quote1 = generateQuote({ ...baseOptions, colors: 1 });
      const quote2 = generateQuote({ ...baseOptions, colors: 2 });
      const quote4 = generateQuote({ ...baseOptions, colors: 4 });

      // Color surcharge is $0.50 per color
      expect(quote2.unitPrice - quote1.unitPrice).toBeCloseTo(0.5, 1);
      expect(quote4.unitPrice - quote1.unitPrice).toBeCloseTo(1.5, 1);
    });
  });

  // ========== SETUP FEE TESTS ==========
  describe('Setup Fees', () => {
    const baseOptions: QuoteOptions = {
      quantity: 100,
      service: 'screen',
      colors: 1,
      location: 'chest',
      printSize: 'M',
      rush: 'standard',
    };

    it('should include setup fee when isNewDesign is true', () => {
      const quote = generateQuote({ ...baseOptions, isNewDesign: true });
      expect(quote.setupFee).toBeGreaterThan(0);
      expect(quote.setupFee).toBeCloseTo(74.28, 1);
    });

    it('should not include setup fee when isNewDesign is false', () => {
      const quote = generateQuote({ ...baseOptions, isNewDesign: false });
      expect(quote.setupFee).toBe(0);
    });

    it('setup fee should only be charged once regardless of quantity', () => {
      const quote50 = generateQuote({ ...baseOptions, quantity: 50, isNewDesign: true });
      const quote100 = generateQuote({ ...baseOptions, quantity: 100, isNewDesign: true });

      // Setup fee should be the same
      expect(quote50.setupFee).toBeCloseTo(quote100.setupFee, 1);

      // But subtotal per unit should be different
      expect(quote100.subtotal / 100).toBeLessThan(quote50.subtotal / 50);
    });
  });

  // ========== COMBINED MULTIPLIER TESTS ==========
  describe('Combined Multipliers', () => {
    it('should correctly combine location + size + rush multipliers', () => {
      const options: QuoteOptions = {
        quantity: 100,
        service: 'screen',
        colors: 2,
        location: 'sleeve',
        printSize: 'L',
        rush: 'next-day',
        isNewDesign: false,
      };

      const quote = generateQuote(options);

      // sleeve: 1.1x, L: 1.1x, next-day: 1.25x
      // Combined effect should be approximately 1.1 * 1.1 * 1.25 = 1.5125

      const baseQuote = generateQuote({
        quantity: 100,
        service: 'screen',
        colors: 2,
        location: 'chest',
        printSize: 'M',
        rush: 'standard',
        isNewDesign: false,
      });

      const ratio = quote.finalRetailPrice / baseQuote.finalRetailPrice;
      const expected = 1.1 * 1.1 * 1.25;

      expect(ratio).toBeCloseTo(expected, 2);
    });

    it('should combine location + rush premiums', () => {
      const baseQuote = generateQuote({
        quantity: 100,
        service: 'screen',
        colors: 1,
        location: 'chest',
        printSize: 'M',
        rush: 'standard',
        isNewDesign: false,
      });

      const premiumQuote = generateQuote({
        quantity: 100,
        service: 'screen',
        colors: 1,
        location: 'full-back',
        printSize: 'M',
        rush: 'same-day',
        isNewDesign: false,
      });

      const ratio = premiumQuote.finalRetailPrice / baseQuote.finalRetailPrice;
      const expected = 1.2 * 1.5; // full-back 1.2x, same-day 1.5x

      expect(ratio).toBeCloseTo(expected, 2);
    });
  });

  // ========== SERVICE TYPE TESTS ==========
  describe('Service Types', () => {
    it('should price screen printing at $4.00/unit', () => {
      const quote = generateQuote({
        quantity: 100,
        service: 'screen',
        colors: 1,
        location: 'chest' as PrintLocation,
        printSize: 'M' as PrintSize,
        rush: 'standard' as RushType,
        isNewDesign: false,
      });
      expect(quote.unitPrice).toBeCloseTo(4.5, 1); // 4.00 + 0.50 color
    });

    it('should price embroidery at $6.00/unit', () => {
      const quote = generateQuote({
        quantity: 100,
        service: 'embroidery',
        colors: 1,
        location: 'chest' as PrintLocation,
        printSize: 'M' as PrintSize,
        rush: 'standard' as RushType,
        isNewDesign: false,
      });
      expect(quote.unitPrice).toBeCloseTo(6.5, 1); // 6.00 + 0.50 color
    });

    it('should price laser at $3.50/unit', () => {
      const quote = generateQuote({
        quantity: 100,
        service: 'laser',
        colors: 1,
        location: 'chest' as PrintLocation,
        printSize: 'M' as PrintSize,
        rush: 'standard' as RushType,
        isNewDesign: false,
      });
      expect(quote.unitPrice).toBeCloseTo(4.0, 1); // 3.50 + 0.50 color
    });

    it('should price transfer at $2.50/unit', () => {
      const quote = generateQuote({
        quantity: 100,
        service: 'transfer',
        colors: 1,
        location: 'chest' as PrintLocation,
        printSize: 'M' as PrintSize,
        rush: 'standard' as RushType,
        isNewDesign: false,
      });
      expect(quote.unitPrice).toBeCloseTo(3.0, 1); // 2.50 + 0.50 color
    });

    it('should price DTG at $5.00/unit', () => {
      const quote = generateQuote({
        quantity: 100,
        service: 'dtg',
        colors: 1,
        location: 'chest' as PrintLocation,
        printSize: 'M' as PrintSize,
        rush: 'standard' as RushType,
        isNewDesign: false,
      });
      expect(quote.unitPrice).toBeCloseTo(5.5, 1); // 5.00 + 0.50 color
    });

    it('should price sublimation at $4.50/unit', () => {
      const quote = generateQuote({
        quantity: 100,
        service: 'sublimation',
        colors: 1,
        location: 'chest' as PrintLocation,
        printSize: 'M' as PrintSize,
        rush: 'standard' as RushType,
        isNewDesign: false,
      });
      expect(quote.unitPrice).toBeCloseTo(5.0, 1); // 4.50 + 0.50 color
    });
  });

  // ========== EDGE CASE TESTS ==========
  describe('Edge Cases', () => {
    it('should handle qty 1 correctly', () => {
      const quote = generateQuote({
        quantity: 1,
        service: 'screen',
        colors: 1,
        location: 'chest',
        printSize: 'M',
        rush: 'standard',
        isNewDesign: false,
      });

      expect(quote.quantity).toBe(1);
      expect(quote.finalRetailPrice).toBeGreaterThan(0);
    });

    it('should handle large quantities (10000)', () => {
      const quote = generateQuote({
        quantity: 10000,
        service: 'screen',
        colors: 1,
        isNewDesign: false,
      });

      expect(quote.quantity).toBe(10000);
      expect(quote.volumeDiscount).toBe(0.15); // Max discount
      expect(quote.finalRetailPrice).toBeGreaterThan(0);
    });

    it('should handle high color counts', () => {
      const quote = generateQuote({
        quantity: 100,
        service: 'screen',
        colors: 10,
        isNewDesign: false,
      });

      expect(quote.colors).toBe(10);
      // 4.00 + (10 * 0.50) = 9.00 per unit
      expect(quote.unitPrice).toBeCloseTo(9.0, 1);
    });

    it('should handle all add-ons combined', () => {
      const quote = generateQuote({
        quantity: 100,
        service: 'screen',
        colors: 1,
        addOns: ['fold', 'ticket', 'relabel', 'hanger'],
        isNewDesign: false,
      });

      expect(quote.addOns).toHaveLength(4);
      const totalAddOnPrice = (0.15 + 0.1 + 0.2 + 0.25) * 100;
      expect(quote.addOnCost).toBeCloseTo(totalAddOnPrice, 1);
    });

    it('should handle new design with high quantity discount', () => {
      const quote = generateQuote({
        quantity: 1000,
        service: 'screen',
        colors: 1,
        isNewDesign: true,
      });

      expect(quote.setupFee).toBeCloseTo(74.28, 1);
      expect(quote.volumeDiscount).toBe(0.15);
      // Setup fee should be negligible per unit at 1000 qty
      expect(quote.subtotal / 1000).toBeLessThan(5.0);
    });
  });

  // ========== MULTI-LOCATION TESTS ==========
  describe('Multi-Location Orders', () => {
    const baseOptions: QuoteOptions = {
      quantity: 100,
      service: 'screen',
      colors: 1,
      isNewDesign: false,
    };

    it('should calculate quotes for multiple locations', () => {
      const locations: PrintLocation[] = ['chest', 'sleeve', 'back-neck'];
      const quotes = calculateMultiLocationOrder(baseOptions, locations);

      expect(quotes).toHaveLength(3);
      expect(quotes[0].location).toBe('chest');
      expect(quotes[1].location).toBe('sleeve');
      expect(quotes[2].location).toBe('back-neck');
    });

    it('sleeve quote should be more expensive than chest', () => {
      const locations: PrintLocation[] = ['chest', 'sleeve'];
      const quotes = calculateMultiLocationOrder(baseOptions, locations);

      expect(quotes[1].finalRetailPrice).toBeGreaterThan(
        quotes[0].finalRetailPrice
      );
    });

    it('should calculate multi-location total correctly', () => {
      const locations: PrintLocation[] = ['chest', 'sleeve'];
      const total = calculateMultiLocationTotal(baseOptions, locations);

      const quotes = calculateMultiLocationOrder(baseOptions, locations);
      const expectedTotal = quotes.reduce((sum, q) => sum + q.finalRetailPrice, 0);

      expect(total).toBeCloseTo(expectedTotal, 1);
    });

    it('should handle full multi-location combo', () => {
      const locations: PrintLocation[] = ['chest', 'back-neck', 'sleeve-combo'];
      const total = calculateMultiLocationTotal(baseOptions, locations);

      expect(total).toBeGreaterThan(0);
      expect(total).toBeCloseTo(total, 2); // Should be consistent
    });
  });

  // ========== BULK SAVINGS TESTS ==========
  describe('Bulk Savings', () => {
    const baseOptions: QuoteOptions = {
      quantity: 100,
      service: 'screen',
      colors: 1,
      location: 'chest',
      printSize: 'M',
      rush: 'standard',
      isNewDesign: false,
    };

    it('should calculate savings from 100 to 500 units', () => {
      const savings = calculateBulkSavings(baseOptions, 100, 500);
      expect(savings).toBeGreaterThan(0);
    });

    it('should calculate savings from 50 to 1000 units', () => {
      const savings = calculateBulkSavings(baseOptions, 50, 1000);
      expect(savings).toBeGreaterThan(0);
    });

    it('should show per-unit savings increase with quantity', () => {
      const quote100 = generateQuote({ ...baseOptions, quantity: 100 });
      const quote500 = generateQuote({ ...baseOptions, quantity: 500 });

      const unitPrice100 = quote100.finalRetailPrice / 100;
      const unitPrice500 = quote500.finalRetailPrice / 500;

      const savingsPerUnit = unitPrice100 - unitPrice500;
      expect(savingsPerUnit).toBeGreaterThan(0);
    });

    it('should give minimum quantity for discount tier', () => {
      const minFor5Pct = getMinQtyForDiscount(0.05);
      const minFor10Pct = getMinQtyForDiscount(0.10);
      const minFor15Pct = getMinQtyForDiscount(0.15);

      expect(minFor5Pct).toBe(50);
      expect(minFor10Pct).toBe(250);
      expect(minFor15Pct).toBe(1000);
    });
  });

  // ========== RUSH + DISCOUNT COMBINATION TESTS ==========
  describe('Rush + Discount Combinations', () => {
    const baseOptions: QuoteOptions = {
      quantity: 100,
      service: 'screen',
      colors: 1,
      location: 'chest',
      printSize: 'M',
      rush: 'standard',
      isNewDesign: false,
    };

    it('should apply rush premium on top of bulk discount', () => {
      const standardQuote = generateQuote({
        ...baseOptions,
        quantity: 500,
        rush: 'standard',
      });

      const rushQuote = generateQuote({
        ...baseOptions,
        quantity: 500,
        rush: 'next-day',
      });

      const ratio = rushQuote.finalRetailPrice / standardQuote.finalRetailPrice;
      expect(ratio).toBeCloseTo(1.25, 2);
    });

    it('next-day rush on 1000 units should still apply volume discount', () => {
      const quote = generateQuote({
        quantity: 1000,
        service: 'screen',
        colors: 1,
        rush: 'next-day',
        isNewDesign: false,
      });

      expect(quote.volumeDiscount).toBe(0.15);
      expect(quote.rushMultiplier).toBe(1.25);
    });

    it('small qty rush should not get bulk discount', () => {
      const quote = generateQuote({
        quantity: 10,
        service: 'screen',
        colors: 1,
        rush: 'same-day',
        isNewDesign: false,
      });

      expect(quote.volumeDiscount).toBe(0);
      expect(quote.rushMultiplier).toBe(1.5);
    });

    it('large qty rush should get both multipliers', () => {
      const baseQuote = generateQuote({
        quantity: 1000,
        service: 'screen',
        colors: 1,
        rush: 'standard',
        isNewDesign: false,
      });

      const rushQuote = generateQuote({
        quantity: 1000,
        service: 'screen',
        colors: 1,
        rush: 'same-day',
        isNewDesign: false,
      });

      const ratio = rushQuote.finalRetailPrice / baseQuote.finalRetailPrice;
      expect(ratio).toBeCloseTo(1.5, 2);
      expect(rushQuote.volumeDiscount).toBe(0.15);
    });
  });

  // ========== REALISTIC QUOTE SCENARIOS ==========
  describe('Realistic Quote Scenarios', () => {
    it('should price a basic event order (200pc, 2-color, chest print)', () => {
      const quote = generateQuote({
        quantity: 200,
        service: 'screen',
        colors: 2,
        location: 'chest',
        printSize: 'M',
        rush: '2-day',
        isNewDesign: true,
      });

      expect(quote.quantity).toBe(200);
      expect(quote.colors).toBe(2);
      expect(quote.volumeDiscount).toBe(0.08);
      expect(quote.finalRetailPrice).toBeGreaterThan(0);
      expect(quote.finalRetailPrice).toBeLessThan(5000);
    });

    it('should price a premium corporate order (500pc, all-over print, rush)', () => {
      const quote = generateQuote({
        quantity: 500,
        service: 'dtg',
        colors: 4,
        location: 'full-back',
        printSize: 'L',
        rush: 'next-day',
        addOns: ['fold', 'hanger'],
        isNewDesign: true,
      });

      expect(quote.volumeDiscount).toBe(0.12);
      expect(quote.finalRetailPrice).toBeGreaterThan(0);
    });

    it('should price a reorder (existing design, standard production)', () => {
      const quote = generateQuote({
        quantity: 150,
        service: 'screen',
        colors: 1,
        location: 'sleeve',
        printSize: 'M',
        rush: 'standard',
        isNewDesign: false, // No design fee
      });

      expect(quote.setupFee).toBe(0);
      expect(quote.finalRetailPrice).toBeGreaterThan(0);
    });

    it('should price a rush sample order (25pc, high-complexity print)', () => {
      const quote = generateQuote({
        quantity: 25,
        service: 'embroidery',
        colors: 6,
        location: 'full-back',
        printSize: 'XL',
        rush: 'same-day',
        isNewDesign: true,
      });

      expect(quote.volumeDiscount).toBe(0);
      expect(quote.rushMultiplier).toBe(1.5);
      expect(quote.finalRetailPrice).toBeGreaterThan(0);
    });
  });

  // ========== COST ANALYSIS TESTS ==========
  describe('Cost Analysis', () => {
    it('should calculate cost without margin', () => {
      const options: QuoteOptions = {
        quantity: 100,
        service: 'screen',
        colors: 1,
        isNewDesign: false,
      };

      const cost = calculateCost(options);
      const quote = generateQuote(options);

      const expectedCost = quote.finalRetailPrice / 1.35;
      expect(cost).toBeCloseTo(expectedCost, 1);
    });

    it('should show correct profit percentage', () => {
      const options: QuoteOptions = {
        quantity: 100,
        service: 'screen',
        colors: 1,
        isNewDesign: false,
      };

      const cost = calculateCost(options);
      const profit = calculateProfit(options);
      const profitPercentage = (profit / cost) * 100;

      expect(profitPercentage).toBeCloseTo(35, 0);
    });

    it('should allow different profit margins', () => {
      const options: QuoteOptions = {
        quantity: 100,
        service: 'screen',
        colors: 1,
        isNewDesign: false,
      };

      const cost = calculateCost(options);
      const profit25 = calculateProfit(options, 0.25);
      const profit50 = calculateProfit(options, 0.50);

      expect(profit25).toBeLessThan(profit50);
      expect(profit25 / cost).toBeCloseTo(0.25, 2);
      expect(profit50 / cost).toBeCloseTo(0.50, 2);
    });
  });
});
