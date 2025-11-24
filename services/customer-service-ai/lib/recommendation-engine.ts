/**
 * Recommendation Engine - Business logic for quote optimization
 */

import { DesignAnalysis, DesignInput, Suggestion, DesignIssue, PrintConfig } from './types';

export class RecommendationEngine {
  /**
   * Generate print configuration from design analysis
   */
  generatePrintConfig(analysis: DesignAnalysis): PrintConfig {
    return {
      location: analysis.optimalLocation,
      size: analysis.recommendedSize,
      method: analysis.suggestedMethod,
      colors: analysis.colorsDetected,
      confidence: analysis.confidence,
    };
  }

  /**
   * Generate suggestions for add-ons and upgrades
   */
  generateSuggestions(
    analysis: DesignAnalysis,
    input: DesignInput
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Add-on: Fold & Bag for high volume
    if (input.quantity >= 100) {
      suggestions.push({
        type: 'add-on',
        title: 'Professional Fold & Bag Service',
        description: `Individually fold and bag all ${input.quantity} items for a polished presentation. Perfect for retail or events.`,
        priceImpact: input.quantity * 0.50, // $0.50 per item
        confidence: 0.9,
      });
    }

    // Add-on: Custom tags for branding
    if (input.customerInfo?.hasExistingBranding) {
      suggestions.push({
        type: 'add-on',
        title: 'Custom Woven Tags',
        description: 'Add professional branded tags to enhance your brand identity and perceived value.',
        priceImpact: input.quantity * 1.25, // $1.25 per item
        confidence: 0.85,
      });
    }

    // Add-on: Custom tickets for retail
    if (input.customerInfo?.isRetailJob || input.customerInfo?.isEventJob) {
      suggestions.push({
        type: 'add-on',
        title: 'Custom Hang Tickets',
        description: 'Professional hang tickets with your branding, pricing, and care instructions.',
        priceImpact: input.quantity * 0.75, // $0.75 per item
        confidence: 0.88,
      });
    }

    // Upgrade: Rush service based on deadline
    if (input.deadline) {
      const rushSuggestion = this.calculateRushService(input.deadline, input.quantity);
      if (rushSuggestion) {
        suggestions.push(rushSuggestion);
      }
    }

    // Upgrade: Larger size for complex designs
    if (analysis.complexity === 'complex' && ['S', 'M'].includes(analysis.recommendedSize)) {
      const newSize = analysis.recommendedSize === 'S' ? 'M' : 'L';
      suggestions.push({
        type: 'upgrade',
        title: `Upgrade to ${newSize} Print Size`,
        description: 'Complex designs benefit from larger print sizes to maintain detail clarity and visual impact.',
        priceImpact: input.quantity * 1.50, // $1.50 per item for size upgrade
        confidence: 0.82,
      });
    }

    // Upgrade: Premium ink for special effects
    if (analysis.colorsDetected <= 3 && analysis.suggestedMethod === 'screen-print') {
      suggestions.push({
        type: 'upgrade',
        title: 'Water-Based or Discharge Ink',
        description: 'Premium soft-hand inks for a high-end feel. Perfect for retail and premium brands.',
        priceImpact: input.quantity * 2.00, // $2 per item premium
        confidence: 0.75,
      });
    }

    // Upsell: Back print bundle
    if (analysis.optimalLocation === 'full-front' || analysis.optimalLocation === 'front-chest') {
      suggestions.push({
        type: 'upgrade',
        title: 'Add Back Print - 15% Discount',
        description: 'Maximize impact with a coordinating back design. Setup already done, minimal additional cost.',
        priceImpact: this.estimateBackPrintCost(input.quantity, analysis) * 0.85, // 15% discount
        confidence: 0.78,
      });
    }

    // Upsell: Individual poly bags
    if (input.quantity >= 50 && !suggestions.some(s => s.title.includes('Fold & Bag'))) {
      suggestions.push({
        type: 'add-on',
        title: 'Individual Poly Bags',
        description: 'Protect items during shipping and storage. Professional presentation for resale.',
        priceImpact: input.quantity * 0.35, // $0.35 per item
        confidence: 0.80,
      });
    }

    // Sort by confidence and return top suggestions
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
  }

  /**
   * Calculate rush service recommendation
   */
  private calculateRushService(deadline: Date, quantity: number): Suggestion | null {
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Estimate base production time
    let standardDays = 7;
    if (quantity > 500) standardDays = 10;
    if (quantity > 1000) standardDays = 12;

    if (daysUntilDeadline < standardDays && daysUntilDeadline >= 5) {
      return {
        type: 'upgrade',
        title: 'Rush Service (5-6 Days)',
        description: `Meet your deadline with rush production. ${daysUntilDeadline} days until deadline.`,
        priceImpact: quantity * 3.00, // $3 per item for rush
        confidence: 0.90,
      };
    } else if (daysUntilDeadline < 5 && daysUntilDeadline >= 3) {
      return {
        type: 'upgrade',
        title: 'Super Rush Service (3-4 Days)',
        description: `Priority production to meet your tight deadline. ${daysUntilDeadline} days until deadline.`,
        priceImpact: quantity * 5.50, // $5.50 per item for super rush
        confidence: 0.95,
      };
    } else if (daysUntilDeadline < 3) {
      return {
        type: 'warning',
        title: 'Emergency Rush Required (1-2 Days)',
        description: `Extremely tight deadline requires emergency production. ${daysUntilDeadline} days until deadline. Additional fees apply.`,
        priceImpact: quantity * 8.00, // $8 per item for emergency
        confidence: 0.98,
      };
    }

    return null;
  }

  /**
   * Estimate back print cost
   */
  private estimateBackPrintCost(quantity: number, analysis: DesignAnalysis): number {
    let baseCost = 5.00; // Base per-item cost
    
    // Adjust for complexity
    if (analysis.complexity === 'complex') baseCost += 2.00;
    if (analysis.complexity === 'moderate') baseCost += 1.00;
    
    // Adjust for colors
    baseCost += (analysis.colorsDetected - 1) * 0.75;
    
    // Volume discount
    if (quantity >= 500) baseCost *= 0.85;
    if (quantity >= 1000) baseCost *= 0.75;
    
    return quantity * baseCost;
  }

  /**
   * Detect design issues and generate warnings
   */
  detectIssues(analysis: DesignAnalysis, input: DesignInput): DesignIssue[] {
    const issues: DesignIssue[] = [];

    // Check for issues from LLM analysis
    analysis.issues.forEach(issue => {
      const severity = this.classifyIssueSeverity(issue);
      issues.push({
        severity,
        message: issue,
        resolution: this.getResolutionForIssue(issue),
      });
    });

    // Check for tight deadlines
    if (input.deadline) {
      const daysUntilDeadline = Math.ceil(
        (input.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilDeadline < 3) {
        issues.push({
          severity: 'high',
          message: `Very tight deadline: ${daysUntilDeadline} days until delivery`,
          resolution: 'Consider emergency rush service or adjust deadline if possible',
        });
      }
    }

    // Check for high color count with screen printing
    if (analysis.colorsDetected > 6 && analysis.suggestedMethod === 'screen-print') {
      issues.push({
        severity: 'medium',
        message: 'High color count for screen printing (7+ colors)',
        resolution: 'Consider DTG printing for better color reproduction and cost efficiency',
      });
    }

    // Check for small text in complex designs
    if (analysis.complexity === 'complex' && analysis.recommendedSize === 'S') {
      issues.push({
        severity: 'medium',
        message: 'Complex design may lose detail at small size',
        resolution: 'Recommend upgrading to Medium or Large size for optimal clarity',
      });
    }

    // Low confidence warning
    if (analysis.confidence < 0.6) {
      issues.push({
        severity: 'low',
        message: 'Automatic analysis has low confidence',
        resolution: 'Manual review by production team recommended before finalizing quote',
      });
    }

    return issues;
  }

  /**
   * Classify issue severity based on content
   */
  private classifyIssueSeverity(issue: string): DesignIssue['severity'] {
    const lowercaseIssue = issue.toLowerCase();
    
    if (lowercaseIssue.includes('low resolution') || 
        lowercaseIssue.includes('missing bleed') ||
        lowercaseIssue.includes('color mode')) {
      return 'high';
    }
    
    if (lowercaseIssue.includes('format') || 
        lowercaseIssue.includes('small text') ||
        lowercaseIssue.includes('background')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Get resolution suggestion for common issues
   */
  private getResolutionForIssue(issue: string): string {
    const lowercaseIssue = issue.toLowerCase();
    
    if (lowercaseIssue.includes('low resolution')) {
      return 'Request high-resolution version (300+ DPI) from customer or recreate in vector format';
    }
    
    if (lowercaseIssue.includes('missing bleed')) {
      return 'Add 0.125" bleed around edges or adjust design to avoid edge-to-edge printing';
    }
    
    if (lowercaseIssue.includes('color mode')) {
      return 'Convert file to appropriate color mode (RGB for DTG, CMYK for screen print separations)';
    }
    
    if (lowercaseIssue.includes('small text')) {
      return 'Increase font size to minimum 8pt or simplify text elements';
    }
    
    return 'Consult with production team for specific recommendations';
  }

  /**
   * Calculate estimated quote value
   */
  calculateEstimatedValue(
    printConfig: PrintConfig,
    input: DesignInput,
    suggestions: Suggestion[]
  ): number {
    // Base price calculation
    let basePrice = this.calculateBasePrice(printConfig, input.quantity);
    
    // Add suggested add-on values (taking top 3 highest confidence)
    const topSuggestions = suggestions
      .filter(s => s.type === 'add-on' || s.type === 'upgrade')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
    
    const suggestedAddons = topSuggestions.reduce((sum, s) => sum + s.priceImpact, 0);
    
    return basePrice + (suggestedAddons * 0.5); // Assume 50% take rate on suggestions
  }

  /**
   * Calculate base print price
   */
  private calculateBasePrice(config: PrintConfig, quantity: number): number {
    // Base rates per method
    const methodRates: Record<string, number> = {
      'screen-print': 7.50,
      'DTG': 12.00,
      'embroidery': 15.00,
      'sublimation': 10.00,
    };

    let unitPrice = methodRates[config.method] || 7.50;
    
    // Adjust for colors (screen printing)
    if (config.method === 'screen-print') {
      unitPrice += (config.colors - 1) * 1.25;
    }
    
    // Adjust for size
    const sizeMultipliers: Record<string, number> = {
      'S': 0.9,
      'M': 1.0,
      'L': 1.2,
      'XL': 1.4,
    };
    unitPrice *= sizeMultipliers[config.size] || 1.0;
    
    // Volume discounts
    if (quantity >= 500) unitPrice *= 0.85;
    if (quantity >= 1000) unitPrice *= 0.75;
    if (quantity >= 2000) unitPrice *= 0.70;
    
    // Setup fee
    const setupFee = config.method === 'screen-print' ? 50 * config.colors : 25;
    
    return (unitPrice * quantity) + setupFee;
  }
}
