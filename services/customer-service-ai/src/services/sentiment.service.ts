/**
 * Sentiment Analysis Service
 * Analyzes text sentiment for customer interactions
 */

import { LLMClient } from '../utils/llm-client';
import { SentimentRequest, SentimentResponse } from '../types';

export class SentimentService {
  private llmClient: LLMClient;

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }

  async analyzeSentiment(request: SentimentRequest): Promise<SentimentResponse> {
    const prompt = this.buildPrompt(request.text);

    try {
      const response = await this.llmClient.chat([
        {
          role: 'system',
          content: `You are a sentiment analysis expert. Analyze the given text and respond with JSON:
{
  "sentiment": "positive|neutral|negative|very_negative",
  "confidence": 0.0-1.0,
  "analysis": "Brief explanation of the sentiment"
}`,
        },
        { role: 'user', content: prompt },
      ]);

      return this.parseResponse(response, request.text);
    } catch (error) {
      // If LLM fails completely, log and use fallback on original text
      console.warn('LLM sentiment analysis failed:', error instanceof Error ? error.message : 'Unknown error');
      return this.fallbackAnalysis(request.text);
    }
  }

  private buildPrompt(text: string): string {
    return `Analyze the sentiment of this customer message:

"${text}"

Consider:
- Overall tone and emotion
- Level of urgency or frustration
- Politeness and courtesy
- Implied satisfaction or dissatisfaction`;
  }

  private parseResponse(response: string, originalText: string): SentimentResponse {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sentiment: parsed.sentiment || 'neutral',
          confidence: parsed.confidence || 0.5,
          analysis: parsed.analysis || 'Unable to determine sentiment.',
        };
      }
    } catch {
      // Fall through to fallback
    }

    // Basic keyword-based fallback on the original text
    return this.fallbackAnalysis(originalText);
  }

  private fallbackAnalysis(text: string): SentimentResponse {
    const lowerText = text.toLowerCase();

    const positiveKeywords = ['thank', 'great', 'excellent', 'happy', 'pleased', 'love', 'wonderful', 'appreciate'];
    const negativeKeywords = ['angry', 'upset', 'frustrated', 'disappointed', 'terrible', 'horrible', 'hate', 'awful'];
    const veryNegativeKeywords = ['furious', 'outraged', 'lawsuit', 'unacceptable', 'demand', 'refund'];

    let positiveScore = 0;
    let negativeScore = 0;

    positiveKeywords.forEach((kw) => {
      if (lowerText.includes(kw)) positiveScore++;
    });
    negativeKeywords.forEach((kw) => {
      if (lowerText.includes(kw)) negativeScore++;
    });
    veryNegativeKeywords.forEach((kw) => {
      if (lowerText.includes(kw)) negativeScore += 2;
    });

    let sentiment: SentimentResponse['sentiment'] = 'neutral';
    if (negativeScore >= 3) {
      sentiment = 'very_negative';
    } else if (negativeScore > positiveScore) {
      sentiment = 'negative';
    } else if (positiveScore > negativeScore) {
      sentiment = 'positive';
    }

    return {
      sentiment,
      confidence: 0.6,
      analysis: `Keyword analysis detected ${positiveScore} positive and ${negativeScore} negative indicators.`,
    };
  }
}
