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
  LlamaStackConfig,
  FileFormat,
} from '../types';
import { ChunkSettings, UploadedDocument } from './DocumentService';

/**
 * Llama Stack API response types
 */
interface LlamaStackFileResponse {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  expires_at?: number;
  filename: string;
  purpose: string;
}

interface LlamaStackVectorStoreFileResponse {
  id: string;
  object: string;
  status: 'completed' | 'in_progress' | 'failed' | 'cancelled';
  created_at: number;
  last_error?: { code: string; message: string } | null;
  usage_bytes: number;
  vector_store_id: string;
  chunking_strategy?: {
    type: string;
    static?: {
      max_chunk_size_tokens: number;
      chunk_overlap_tokens: number;
    };
  };
}

interface LlamaStackSearchResult {
  file_id: string;
  filename: string;
  score: number;
  attributes: Record<string, any>;
  content: Array<{ type: string; text: string }>;
}

interface LlamaStackSearchResponse {
  object: string;
  search_query: string;
  data: LlamaStackSearchResult[];
  has_more: boolean;
}

interface LlamaStackVectorStoreResponse {
  id: string;
  object: string;
  name: string;
  status: string;
  file_counts: {
    total: number;
    completed: number;
    in_progress: number;
    failed: number;
    cancelled: number;
  };
}

/**
 * Knowledge Base service implementation using Llama Stack's OpenAI-compatible APIs.
 * Uses the Responses API for RAG, which handles embeddings and search automatically.
 */
export class LlamaStackKnowledgeBaseService implements KnowledgeBaseService {
  private readonly config: LlamaStackConfig;
  private readonly logger: LoggerService;

  constructor(config: LlamaStackConfig, logger: LoggerService) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Make an API request to Llama Stack
   */
  private async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.config.token) {
      headers.Authorization = `Bearer ${this.config.token}`;
    }

    // Don't set Content-Type for FormData (browser/node will set it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Llama Stack API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Upload documents to the knowledge base
   * Uses Llama Stack's Files API to upload and attach to vector store
   */
  async uploadDocuments(
    files: Array<{ content: string; fileName: string }>,
    _settings: ChunkSettings,
  ): Promise<UploadedDocument[]> {
    const uploadedDocs: UploadedDocument[] = [];

    for (const file of files) {
      try {
        this.logger.info(`Uploading file to Llama Stack: ${file.fileName}`);

        // Step 1: Upload file to Files API
        const formData = new FormData();
        const blob = new Blob([file.content], { type: 'text/plain' });
        formData.append('file', blob, file.fileName);
        formData.append('purpose', 'assistants');

        const uploadResponse = await this.fetchApi<LlamaStackFileResponse>(
          '/v1/openai/v1/files',
          {
            method: 'POST',
            body: formData,
            headers: {}, // Let FormData set Content-Type with boundary
          },
        );

        this.logger.info(
          `File uploaded: ${uploadResponse.id} (${uploadResponse.bytes} bytes)`,
        );

        // Step 2: Attach file to vector store with chunking strategy
        const chunkingStrategy =
          this.config.chunkingStrategy === 'auto'
            ? { type: 'auto' as const }
            : {
                type: 'static' as const,
                static: {
                  max_chunk_size_tokens: this.config.maxChunkSizeTokens,
                  chunk_overlap_tokens: this.config.chunkOverlapTokens,
                },
              };

        const attachResponse =
          await this.fetchApi<LlamaStackVectorStoreFileResponse>(
            `/v1/openai/v1/vector_stores/${this.config.vectorStoreId}/files`,
            {
              method: 'POST',
              body: JSON.stringify({
                file_id: uploadResponse.id,
                chunking_strategy: chunkingStrategy,
              }),
            },
          );

        if (attachResponse.status === 'failed') {
          this.logger.warn(
            `File attachment failed for ${file.fileName}: ${attachResponse.last_error?.message}`,
          );
          continue;
        }

        this.logger.info(
          `File attached to vector store: ${attachResponse.id} (status: ${attachResponse.status})`,
        );

        uploadedDocs.push({
          id: uploadResponse.id,
          fileName: file.fileName,
          fileSize: uploadResponse.bytes,
          chunkCount: 1, // Llama Stack handles chunking internally
          uploadedAt: new Date().toISOString(),
        });
      } catch (error) {
        this.logger.error(
          `Failed to upload ${file.fileName}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    return uploadedDocs;
  }

  /**
   * List all documents in the knowledge base
   */
  async listDocuments(_namespace?: string): Promise<DocumentInfo[]> {
    try {
      // Get files from vector store
      const response = await this.fetchApi<{
        object: string;
        data: LlamaStackVectorStoreFileResponse[];
        has_more: boolean;
      }>(
        `/v1/openai/v1/vector_stores/${this.config.vectorStoreId}/files?limit=100`,
        { method: 'GET' },
      );

      const documents: DocumentInfo[] = [];
      const seenFileIds = new Set<string>();

      for (const vsFile of response.data) {
        // Skip duplicates (API sometimes returns duplicates)
        if (seenFileIds.has(vsFile.id)) {
          continue;
        }
        seenFileIds.add(vsFile.id);

        // Get file details to get filename
        try {
          const fileDetails = await this.fetchApi<LlamaStackFileResponse>(
            `/v1/openai/v1/files/${vsFile.id}`,
            { method: 'GET' },
          );

          const format = this.detectFileFormat(fileDetails.filename);

          documents.push({
            fileName: fileDetails.filename,
            format,
            chunkCount: 1,
            uploadedAt: new Date(vsFile.created_at * 1000).toISOString(),
            totalSize: fileDetails.bytes,
          });
        } catch (error) {
          this.logger.warn(
            `Could not get details for file ${vsFile.id}: ${error}`,
          );
        }
      }

      return documents;
    } catch (error) {
      this.logger.error(`Failed to list documents: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a document by fileName
   */
  async deleteDocument(
    fileName: string,
    _namespace?: string,
  ): Promise<{ deletedCount: number }> {
    try {
      // First, find the file ID by listing files
      const documents = await this.listDocuments();
      const doc = documents.find(d => d.fileName === fileName);

      if (!doc) {
        this.logger.warn(`Document not found: ${fileName}`);
        return { deletedCount: 0 };
      }

      // Get all vector store files to find the file ID
      const response = await this.fetchApi<{
        data: LlamaStackVectorStoreFileResponse[];
      }>(
        `/v1/openai/v1/vector_stores/${this.config.vectorStoreId}/files?limit=100`,
        { method: 'GET' },
      );

      // Find matching file by getting details
      let fileIdToDelete: string | null = null;
      for (const vsFile of response.data) {
        try {
          const fileDetails = await this.fetchApi<LlamaStackFileResponse>(
            `/v1/openai/v1/files/${vsFile.id}`,
            { method: 'GET' },
          );
          if (fileDetails.filename === fileName) {
            fileIdToDelete = vsFile.id;
            break;
          }
        } catch {
          // File might not exist, continue
        }
      }

      if (!fileIdToDelete) {
        return { deletedCount: 0 };
      }

      // Delete from vector store
      await this.fetchApi(
        `/v1/openai/v1/vector_stores/${this.config.vectorStoreId}/files/${fileIdToDelete}`,
        { method: 'DELETE' },
      );

      this.logger.info(`Deleted document: ${fileName} (${fileIdToDelete})`);
      return { deletedCount: 1 };
    } catch (error) {
      this.logger.error(`Failed to delete document ${fileName}: ${error}`);
      throw error;
    }
  }

  /**
   * Search the knowledge base with a text query
   * Uses Llama Stack's vector store search endpoint
   */
  async search(
    query: string,
    options?: SearchOptions,
  ): Promise<SearchResult[]> {
    try {
      const response = await this.fetchApi<LlamaStackSearchResponse>(
        `/v1/openai/v1/vector_stores/${this.config.vectorStoreId}/search`,
        {
          method: 'POST',
          body: JSON.stringify({
            query,
            max_num_results: options?.topK || 5,
            search_mode: 'vector',
          }),
        },
      );

      return response.data.map((result, index) => ({
        id: result.attributes?.document_id || `result-${index}`,
        score: result.score,
        content: result.content.map(c => c.text).join('\n'),
        metadata: {
          ...result.attributes,
          fileName: result.filename || 'unknown',
        },
      }));
    } catch (error) {
      this.logger.error(`Search failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get status of the knowledge base
   */
  async getStatus(): Promise<KnowledgeBaseStatus> {
    try {
      // Check health
      const healthResponse = await this.fetchApi<{ status?: string }>(
        '/v1/health',
        { method: 'GET' },
      );

      // Get vector store info
      let vectorStoreInfo: LlamaStackVectorStoreResponse | null = null;
      try {
        vectorStoreInfo = await this.fetchApi<LlamaStackVectorStoreResponse>(
          `/v1/openai/v1/vector_stores/${this.config.vectorStoreId}`,
          { method: 'GET' },
        );
      } catch {
        // Vector store might not be accessible
      }

      const isHealthy = healthResponse.status === 'ok' || !!healthResponse;

      return {
        configured: true,
        embeddingProvider: {
          id: 'llamastack',
          model: 'built-in',
          dimensions: 0, // Llama Stack handles this internally
          connected: isHealthy,
        },
        vectorStore: {
          id: 'llamastack',
          indexName: this.config.vectorStoreId,
          connected: isHealthy && !!vectorStoreInfo,
          totalDocuments: vectorStoreInfo?.file_counts?.total,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Status check failed: ${error}`);
      return {
        configured: true,
        embeddingProvider: {
          id: 'llamastack',
          model: 'built-in',
          dimensions: 0,
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        vectorStore: {
          id: 'llamastack',
          indexName: this.config.vectorStoreId,
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Detect file format from filename
   */
  private detectFileFormat(fileName: string): FileFormat {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'yaml':
      case 'yml':
        return FileFormat.YAML;
      case 'pdf':
        return FileFormat.PDF;
      case 'md':
      case 'markdown':
        return FileFormat.MARKDOWN;
      default:
        return FileFormat.TEXT;
    }
  }
}
