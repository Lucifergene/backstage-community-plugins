/*
 * Copyright 2025 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { LoggerService } from '@backstage/backend-plugin-api';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EmbeddingProvider } from './base-embedding-provider';
import { ProviderConfig } from '../types';

export class GeminiEmbeddingProvider extends EmbeddingProvider {
  private genAI: GoogleGenerativeAI;

  constructor(config: ProviderConfig, logger: LoggerService) {
    super(config, logger);
    if (!this.config.apiKey) {
      throw new Error('Gemini API key is required for embedding generation');
    }
    this.genAI = new GoogleGenerativeAI(this.config.apiKey);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel = this.config.embeddingModel || 'text-embedding-004';
      const model = this.genAI.getGenerativeModel({ model: embeddingModel });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      this.logger.error(
        `Failed to generate Gemini embedding: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddingModel = this.config.embeddingModel || 'text-embedding-004';
      const model = this.genAI.getGenerativeModel({ model: embeddingModel });

      // Process in batches to avoid rate limiting
      const batchSize = 10;
      const results: number[][] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        this.logger.info(
          `Processing embedding batch ${
            Math.floor(i / batchSize) + 1
          }/${Math.ceil(texts.length / batchSize)}`,
        );

        const batchResults = await Promise.all(
          batch.map(text => model.embedContent(text)),
        );

        results.push(...batchResults.map(r => r.embedding.values));

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results;
    } catch (error) {
      this.logger.error(
        `Failed to generate Gemini batch embeddings: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      await this.generateEmbedding('test');
      return { connected: true };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

