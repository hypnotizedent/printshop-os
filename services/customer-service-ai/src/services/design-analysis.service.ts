/**
 * Design Analysis Service
 * AI-powered design file analysis for print feasibility
 */

import { LLMClient } from '../utils/llm-client';
import { DesignAnalysisRequest, DesignAnalysisResponse, DesignIssue } from '../types';

export class DesignAnalysisService {
  private llmClient: LLMClient;

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }

  async analyzeDesign(request: DesignAnalysisRequest): Promise<DesignAnalysisResponse> {
    const prompt = this.buildAnalysisPrompt();

    const response = await this.llmClient.analyzeImage(request.imageUrl, prompt);

    return this.parseAnalysisResponse(response);
  }

  private buildAnalysisPrompt(): string {
    return `Analyze this design image for print production feasibility.

Evaluate and respond with JSON:
{
  "colorCount": number of distinct colors,
  "hasGradient": true if gradients are present,
  "resolution": {
    "quality": "high|medium|low|insufficient",
    "estimatedDpi": number
  },
  "textDetected": true if text is present,
  "textClarity": "clear|acceptable|blurry|unreadable" (if text exists),
  "recommendedService": "screen_print|dtg|embroidery|sublimation",
  "issues": [
    {
      "type": "resolution|colors|gradient|bleed|text_clarity|format",
      "severity": "error|warning|info",
      "message": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "suitabilityScores": {
    "screen_print": 0-100,
    "dtg": 0-100,
    "embroidery": 0-100,
    "sublimation": 0-100
  },
  "confidence": 0.0-1.0
}

Consider:
- Screen printing: Best for 1-6 solid colors, no gradients, high contrast
- DTG: Best for complex artwork, photos, unlimited colors
- Embroidery: Best for simple logos, text, limited detail
- Sublimation: Best for all-over prints, polyester fabrics, vibrant colors

Identify any potential issues that would affect print quality.`;
  }

  private parseAnalysisResponse(response: string): DesignAnalysisResponse {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Determine recommended service based on suitability scores
        const scores = parsed.suitabilityScores || {};
        let recommendedService: DesignAnalysisResponse['recommendedService'] = 'dtg';
        let maxScore = 0;

        const services: Array<DesignAnalysisResponse['recommendedService']> = [
          'screen_print',
          'dtg',
          'embroidery',
          'sublimation',
        ];
        services.forEach((service) => {
          if (scores[service] > maxScore) {
            maxScore = scores[service];
            recommendedService = service;
          }
        });

        // Map resolution quality to DPI
        const dpiMap: Record<string, number> = {
          high: 300,
          medium: 150,
          low: 100,
          insufficient: 72,
        };

        return {
          colorCount: parsed.colorCount || 1,
          hasGradient: parsed.hasGradient || false,
          resolution: {
            // Use parsed dimensions if available, otherwise mark as unknown (-1)
            width: parsed.resolution?.width || -1,
            height: parsed.resolution?.height || -1,
            dpi: dpiMap[parsed.resolution?.quality] || parsed.resolution?.estimatedDpi || 150,
          },
          textDetected: parsed.textDetected || false,
          recommendedService,
          issues: this.normalizeIssues(parsed.issues || []),
          estimatedPrice: this.estimatePrice(recommendedService, parsed.colorCount || 1),
          confidence: parsed.confidence || 0.7,
        };
      }
    } catch (error) {
      // Log parsing error for debugging
      console.warn('Design analysis parsing error:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Return default response if parsing fails
    return this.defaultAnalysisResponse();
  }

  private normalizeIssues(issues: DesignIssue[]): DesignIssue[] {
    return issues.map((issue) => ({
      type: issue.type || 'format',
      severity: issue.severity || 'warning',
      message: issue.message || 'Unknown issue detected',
      suggestion: issue.suggestion || 'Please review the design file',
    }));
  }

  private estimatePrice(
    service: DesignAnalysisResponse['recommendedService'],
    colorCount: number
  ): DesignAnalysisResponse['estimatedPrice'] {
    // Base pricing by service type
    const pricing: Record<string, { base: number; setup: number; perUnit: number }> = {
      screen_print: {
        base: 5.0,
        setup: 25.0 * Math.min(colorCount, 6), // $25 per color setup
        perUnit: 2.0 + colorCount * 0.5, // Base + per color
      },
      dtg: {
        base: 8.0,
        setup: 0, // No setup for DTG
        perUnit: 4.5,
      },
      embroidery: {
        base: 6.0,
        setup: 40.0, // Digitizing fee
        perUnit: 5.0,
      },
      sublimation: {
        base: 7.0,
        setup: 15.0,
        perUnit: 6.0,
      },
    };

    const servicePricing = pricing[service] || pricing.dtg;

    return {
      basePrice: servicePricing.base,
      setupFee: servicePricing.setup,
      perUnit: servicePricing.perUnit,
    };
  }

  private defaultAnalysisResponse(): DesignAnalysisResponse {
    return {
      colorCount: 1,
      hasGradient: false,
      resolution: { width: 0, height: 0, dpi: 72 },
      textDetected: false,
      recommendedService: 'dtg',
      issues: [
        {
          type: 'format',
          severity: 'warning',
          message: 'Unable to fully analyze the design',
          suggestion: 'Please ensure the image is in a supported format (PNG, JPG, PDF)',
        },
      ],
      estimatedPrice: {
        basePrice: 8.0,
        setupFee: 0,
        perUnit: 4.5,
      },
      confidence: 0.3,
    };
  }
}
