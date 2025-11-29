/**
 * Sentiment Service Tests
 */

import { SentimentService } from '../services/sentiment.service';

// Mock LLM Client
const mockLLMClient = {
  chat: jest.fn(),
  embed: jest.fn(),
  embedBatch: jest.fn(),
  analyzeImage: jest.fn(),
  isAvailable: jest.fn().mockReturnValue(true),
  getModelInfo: jest.fn().mockReturnValue({ provider: 'mock', model: 'test' }),
};

describe('SentimentService', () => {
  let sentimentService: SentimentService;

  beforeEach(() => {
    jest.clearAllMocks();
    sentimentService = new SentimentService(mockLLMClient as any);
  });

  describe('analyzeSentiment', () => {
    it('should parse positive sentiment from LLM response', async () => {
      mockLLMClient.chat.mockResolvedValue(
        JSON.stringify({
          sentiment: 'positive',
          confidence: 0.9,
          analysis: 'Customer is happy with the service',
        })
      );

      const result = await sentimentService.analyzeSentiment({
        text: 'Thank you so much for the great work!',
      });

      expect(result.sentiment).toBe('positive');
      expect(result.confidence).toBe(0.9);
      expect(mockLLMClient.chat).toHaveBeenCalledTimes(1);
    });

    it('should parse negative sentiment from LLM response', async () => {
      mockLLMClient.chat.mockResolvedValue(
        JSON.stringify({
          sentiment: 'negative',
          confidence: 0.85,
          analysis: 'Customer is frustrated',
        })
      );

      const result = await sentimentService.analyzeSentiment({
        text: "I'm disappointed with my order",
      });

      expect(result.sentiment).toBe('negative');
      expect(result.confidence).toBe(0.85);
    });

    it('should fallback to keyword analysis when LLM returns non-JSON response', async () => {
      // When LLM returns non-JSON, it falls back to analyzing the LLM's response
      // Since "Invalid response without JSON" has no sentiment keywords, result is neutral
      mockLLMClient.chat.mockResolvedValue('Invalid response without JSON');

      const result = await sentimentService.analyzeSentiment({
        text: "I'm frustrated with my order",
      });

      // Fallback analyzes the LLM response, not the original text
      expect(result.sentiment).toBe('neutral');
      expect(result.confidence).toBe(0.6);
    });

    it('should detect very negative sentiment', async () => {
      mockLLMClient.chat.mockResolvedValue(
        JSON.stringify({
          sentiment: 'very_negative',
          confidence: 0.95,
          analysis: 'Customer is outraged',
        })
      );

      const result = await sentimentService.analyzeSentiment({
        text: 'This is unacceptable! I demand a refund!',
      });

      expect(result.sentiment).toBe('very_negative');
    });

    it('should return neutral for ambiguous text', async () => {
      mockLLMClient.chat.mockResolvedValue(
        JSON.stringify({
          sentiment: 'neutral',
          confidence: 0.7,
          analysis: 'Message is informational',
        })
      );

      const result = await sentimentService.analyzeSentiment({
        text: 'What are your business hours?',
      });

      expect(result.sentiment).toBe('neutral');
    });
  });
});
