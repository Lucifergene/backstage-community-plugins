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
import { ProviderConfig } from '../types';

/**
 * Abstract base class for embedding providers
 */
export abstract class EmbeddingProvider {
  protected readonly config: ProviderConfig;
  protected readonly logger: LoggerService;

  constructor(config: ProviderConfig, logger: LoggerService) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Generate embedding for a single text
   */
  abstract generateEmbedding(text: string): Promise<number[]>;

  /**
   * Generate embeddings for multiple texts in batch
   */
  abstract generateBatchEmbeddings(texts: string[]): Promise<number[][]>;

  /**
   * Test connection to the embedding provider
   */
  abstract testConnection(): Promise<{ connected: boolean; error?: string }>;

  /**
   * Get the dimensions of the embedding model
   */
  getDimensions(): number {
    return this.config.dimensions || 0;
  }

  /**
   * Get the embedding model name
   */
  getModel(): string {
    return this.config.embeddingModel || 'default';
  }
}

