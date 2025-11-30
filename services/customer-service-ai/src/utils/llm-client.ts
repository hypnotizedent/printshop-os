/**
 * OpenAI Client Utility
 * Wrapper for OpenAI API calls with fallback to Ollama for local development
 */

import OpenAI from 'openai';
import axios from 'axios';
import { AIConfig } from '../types';

export class LLMClient {
  private openai?: OpenAI;
  private ollamaUrl?: string;
  private model: string;
  private embeddingModel: string;
  private temperature: number;
  private maxTokens: number;
  private useOllama: boolean;

  constructor(config: AIConfig) {
    this.model = config.model;
    this.embeddingModel = config.embeddingModel;
    this.temperature = config.temperature;
    this.maxTokens = config.maxTokens;
    this.ollamaUrl = config.ollamaUrl;

    if (config.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: config.openaiApiKey,
      });
      this.useOllama = false;
    } else if (config.ollamaUrl) {
      this.useOllama = true;
    } else {
      throw new Error('Either OpenAI API key or Ollama URL must be provided');
    }
  }

  async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
    if (this.useOllama) {
      return this.chatWithOllama(messages);
    }
    return this.chatWithOpenAI(messages);
  }

  private async chatWithOpenAI(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: messages as OpenAI.ChatCompletionMessageParam[],
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    });

    return response.choices[0]?.message?.content || '';
  }

  private async chatWithOllama(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    if (!this.ollamaUrl) {
      throw new Error('Ollama URL not configured');
    }

    const response = await axios.post(`${this.ollamaUrl}/api/chat`, {
      model: this.model,
      messages,
      stream: false,
      options: {
        temperature: this.temperature,
        num_predict: this.maxTokens,
      },
    });

    return response.data.message?.content || '';
  }

  async embed(text: string): Promise<number[]> {
    if (this.useOllama) {
      return this.embedWithOllama(text);
    }
    return this.embedWithOpenAI(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (this.useOllama) {
      return Promise.all(texts.map((t) => this.embedWithOllama(t)));
    }
    return this.embedBatchWithOpenAI(texts);
  }

  private async embedWithOpenAI(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openai.embeddings.create({
      model: this.embeddingModel,
      input: text,
    });

    return response.data[0].embedding;
  }

  private async embedBatchWithOpenAI(texts: string[]): Promise<number[][]> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openai.embeddings.create({
      model: this.embeddingModel,
      input: texts,
    });

    return response.data.map((d) => d.embedding);
  }

  private async embedWithOllama(text: string): Promise<number[]> {
    if (!this.ollamaUrl) {
      throw new Error('Ollama URL not configured');
    }

    const response = await axios.post(`${this.ollamaUrl}/api/embeddings`, {
      model: this.embeddingModel,
      prompt: text,
    });

    return response.data.embedding;
  }

  async analyzeImage(imageUrl: string, prompt: string): Promise<string> {
    if (this.useOllama) {
      // Ollama vision models like llava can be used here
      return this.analyzeImageWithOllama(imageUrl, prompt);
    }
    return this.analyzeImageWithOpenAI(imageUrl, prompt);
  }

  private async analyzeImageWithOpenAI(imageUrl: string, prompt: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o', // Vision-capable model
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: this.maxTokens,
    });

    return response.choices[0]?.message?.content || '';
  }

  private async analyzeImageWithOllama(imageUrl: string, prompt: string): Promise<string> {
    if (!this.ollamaUrl) {
      throw new Error('Ollama URL not configured');
    }

    // Download image and convert to base64 for Ollama
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imageResponse.data).toString('base64');

    const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
      model: 'llava', // or another vision-capable model
      prompt,
      images: [base64Image],
      stream: false,
    });

    return response.data.response || '';
  }

  isAvailable(): boolean {
    return !!(this.openai || this.ollamaUrl);
  }

  getModelInfo(): { provider: string; model: string } {
    return {
      provider: this.useOllama ? 'ollama' : 'openai',
      model: this.model,
    };
  }
}
