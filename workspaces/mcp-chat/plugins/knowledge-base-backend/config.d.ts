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
export interface Config {
  /** Configuration for the Knowledge Base backend plugin */
  knowledgeBase?: {
    /**
     * Embedding providers configuration (array format - first is active)
     * Required for pinecone/chromadb vector stores.
     * NOT required if using llamastack (which handles embeddings internally).
     * @visibility backend
     */
    embeddingProviders?: Array<{
      /**
       * Provider ID: openai, gemini
       * @visibility backend
       */
      id: string;
      /**
       * API key/token for the provider
       * @visibility secret
       */
      token?: string;
      /**
       * Embedding model name
       * @visibility backend
       */
      model: string;
      /**
       * Embedding dimensions
       * @visibility backend
       */
      dimensions?: number;
      /**
       * Base URL for the provider (optional, uses default if not provided)
       * @visibility backend
       */
      baseUrl?: string;
    }>;
    /**
     * Vector stores configuration (array format - first is active)
     * Supported providers: pinecone, chromadb, llamastack
     * @visibility backend
     */
    vectorStores?: Array<{
      /**
       * Vector store ID: pinecone, chromadb, llamastack
       * @visibility backend
       */
      id: string;
      /**
       * API key for the vector store service (for Pinecone)
       * @visibility secret
       */
      apiKey?: string;
      /**
       * Base URL (for ChromaDB or LlamaStack)
       * @visibility backend
       */
      baseUrl?: string;
      /**
       * Index/collection name (required for pinecone/chromadb, not for llamastack)
       * @visibility backend
       */
      indexName?: string;
      /**
       * Environment (for Pinecone)
       * @visibility backend
       */
      environment?: string;
      /**
       * Additional configuration options
       * @visibility backend
       */
      config?: { [key: string]: string };
      // LlamaStack-specific fields
      /**
       * ID of an existing vector store on the Llama Stack server (llamastack only)
       * @visibility backend
       */
      vectorStoreId?: string;
      /**
       * API token for LlamaStack authentication (llamastack only)
       * @visibility secret
       */
      token?: string;
      /**
       * Chunking strategy: 'auto' or 'static' (llamastack only)
       * @visibility backend
       */
      chunkingStrategy?: 'auto' | 'static';
      /**
       * Max chunk size in tokens for static chunking (llamastack only)
       * @visibility backend
       */
      maxChunkSizeTokens?: number;
      /**
       * Chunk overlap in tokens for static chunking (llamastack only)
       * @visibility backend
       */
      chunkOverlapTokens?: number;
    }>;
  };
}
