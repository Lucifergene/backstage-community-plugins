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

export interface VectorStoreDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface VectorStoreQueryResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
}

export interface VectorStoreConfig {
  id: string;
  apiKey?: string;
  baseUrl?: string;
  indexName: string;
  environment?: string;
  config?: Record<string, string>;
}

/**
 * Abstract base class for vector store providers
 */
export abstract class VectorStoreProvider {
  protected config: VectorStoreConfig;

  constructor(config: VectorStoreConfig) {
    this.config = config;
  }

  /**
   * Initialize connection to the vector store
   */
  abstract connect(): Promise<void>;

  /**
   * Check if the connection is healthy
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Upsert (insert or update) documents into the vector store
   */
  abstract upsert(documents: VectorStoreDocument[]): Promise<void>;

  /**
   * Query the vector store with a vector embedding
   */
  abstract query(
    embedding: number[],
    topK: number,
    filter?: Record<string, any>,
  ): Promise<VectorStoreQueryResult[]>;

  /**
   * Delete documents by IDs
   */
  abstract delete(ids: string[]): Promise<void>;

  /**
   * Delete all documents (use with caution)
   */
  abstract deleteAll(): Promise<void>;

  /**
   * Get document by ID
   */
  abstract getById(id: string): Promise<VectorStoreDocument | null>;

  /**
   * Get statistics about the index
   */
  abstract getStats(): Promise<{
    totalDocuments: number;
    indexName: string;
    dimensions: number;
  }>;

  /**
   * List all vector IDs in the index (with pagination support)
   */
  abstract listIds(
    limit?: number,
    paginationToken?: string,
    namespace?: string,
  ): Promise<{ ids: string[]; nextToken?: string }>;

  /**
   * Fetch vectors by IDs to get their metadata
   */
  abstract fetchByIds(
    ids: string[],
    namespace?: string,
  ): Promise<VectorStoreDocument[]>;
}

