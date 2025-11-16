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
import { KnowledgeBaseService } from './KnowledgeBaseService';
import {
  DocumentInfo,
  SearchOptions,
  SearchResult,
  KnowledgeBaseStatus,
} from '../types';
import { ChunkSettings, UploadedDocument, DocumentService } from './DocumentService';
import { EmbeddingProvider } from '../providers/base-embedding-provider';
import { VectorStoreProvider } from '../vectorstores/base-vectorstore';

/**
 * Implementation of KnowledgeBaseService
 */
export class KnowledgeBaseServiceImpl implements KnowledgeBaseService {
  constructor(
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly vectorStore: VectorStoreProvider,
    private readonly documentService: DocumentService,
    private readonly logger: LoggerService,
  ) {}

  async uploadDocuments(
    files: Array<{ content: string; fileName: string }>,
    settings: ChunkSettings,
  ): Promise<UploadedDocument[]> {
    return await this.documentService.uploadFiles(files, settings);
  }

  async listDocuments(namespace?: string): Promise<DocumentInfo[]> {
    return await this.documentService.listDocuments(namespace);
  }

  async deleteDocument(
    fileName: string,
    namespace?: string,
  ): Promise<{ deletedCount: number }> {
    return await this.documentService.deleteDocument(fileName, namespace);
  }

  async search(
    query: string,
    options?: SearchOptions,
  ): Promise<SearchResult[]> {
    try {
      const topK = options?.topK || 3;
      const filter = options?.filter;

      // Generate embedding for the query
      const queryEmbedding = await this.embeddingProvider.generateEmbedding(
        query,
      );

      // Query vector store
      const results = await this.vectorStore.query(
        queryEmbedding,
        topK,
        filter,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Failed to search knowledge base: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }

  async getStatus(): Promise<KnowledgeBaseStatus> {
    try {
      // Test embedding provider
      const embeddingTest = await this.embeddingProvider.testConnection();

      // Test vector store
      const vectorStoreHealthy = await this.vectorStore.healthCheck();

      let vectorStoreStats;
      if (vectorStoreHealthy) {
        try {
          vectorStoreStats = await this.vectorStore.getStats();
        } catch (err) {
          this.logger.warn(`Failed to get vector store stats: ${err}`);
        }
      }

      return {
        configured: true,
        embeddingProvider: {
          id: this.embeddingProvider.getModel(),
          model: this.embeddingProvider.getModel(),
          dimensions: this.embeddingProvider.getDimensions(),
          connected: embeddingTest.connected,
          error: embeddingTest.error,
        },
        vectorStore: {
          id: (this.vectorStore as any).config?.id || 'unknown',
          indexName: (this.vectorStore as any).config?.indexName || 'unknown',
          connected: vectorStoreHealthy,
          totalDocuments: vectorStoreStats?.totalDocuments,
          dimensions: vectorStoreStats?.dimensions,
          error: vectorStoreHealthy ? undefined : 'Connection failed',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get knowledge base status: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }
}

