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
import { EmbeddingProvider } from './base-embedding-provider';
import { ProviderConfig } from '../types';

export class OpenAIEmbeddingProvider extends EmbeddingProvider {
  constructor(config: ProviderConfig, logger: LoggerService) {
    super(config, logger);
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required for embedding generation');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel =
        this.config.embeddingModel || 'text-embedding-3-small';

      const response = await fetch(`${this.config.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          input: text,
          model: embeddingModel,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `OpenAI API error: ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      this.logger.error(
        `Failed to generate OpenAI embedding: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddingModel =
        this.config.embeddingModel || 'text-embedding-3-small';

      // OpenAI supports batch embeddings natively
      const response = await fetch(`${this.config.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          input: texts,
          model: embeddingModel,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `OpenAI API error: ${response.statusText} - ${errorText}`,
        );
      }

      const data = await response.json();
      return data.data.map((item: any) => item.embedding);
    } catch (error) {
      this.logger.error(
        `Failed to generate OpenAI batch embeddings: ${
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

