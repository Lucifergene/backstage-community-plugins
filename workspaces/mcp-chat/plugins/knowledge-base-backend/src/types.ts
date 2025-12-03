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

// =============================================================================
// Provider Configuration Types
// =============================================================================

export interface ProviderConfig {
  type: string;
  apiKey?: string;
  baseUrl: string;
  model: string;
  embeddingModel?: string;
  dimensions?: number;
}

// =============================================================================
// Llama Stack Configuration Types
// =============================================================================

/**
 * Configuration for Llama Stack integration
 * Uses Llama Stack's OpenAI-compatible APIs with Responses API for RAG
 */
export interface LlamaStackConfig {
  /** Base URL for the Llama Stack server */
  baseUrl: string;
  /** ID of an existing vector store on the Llama Stack server */
  vectorStoreId: string;
  /** LLM model to use for Responses API (e.g., 'gemini/gemini-2.5-flash') */
  model: string;
  /** Optional API token for authentication */
  token?: string;
  /** Chunking strategy for file uploads: 'auto' or 'static' */
  chunkingStrategy: 'auto' | 'static';
  /** Max chunk size in tokens (for static chunking) */
  maxChunkSizeTokens: number;
  /** Chunk overlap in tokens (for static chunking) */
  chunkOverlapTokens: number;
}

// =============================================================================
// Document Types
// =============================================================================

export enum FileFormat {
  YAML = 'yaml',
  PDF = 'pdf',
  TEXT = 'text',
  MARKDOWN = 'markdown',
}

export interface DocumentInfo {
  fileName: string;
  format: FileFormat;
  kind?: string;
  apiVersion?: string;
  namespace?: string;
  chunkCount: number;
  uploadedAt: string;
  totalSize: number;
  pageCount?: number;
  author?: string;
  lineCount?: number;
}

// =============================================================================
// Search Types
// =============================================================================

export interface SearchOptions {
  topK?: number;
  filter?: Record<string, any>;
  namespace?: string;
}

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
}

// =============================================================================
// Knowledge Base Status Types
// =============================================================================

export interface EmbeddingProviderStatus {
  id: string;
  model: string;
  dimensions: number;
  connected: boolean;
  error?: string;
}

export interface VectorStoreStatus {
  id: string;
  indexName: string;
  connected: boolean;
  totalDocuments?: number;
  dimensions?: number;
  error?: string;
}

export interface KnowledgeBaseStatus {
  configured: boolean;
  embeddingProvider?: EmbeddingProviderStatus;
  vectorStore?: VectorStoreStatus;
  timestamp: string;
}
