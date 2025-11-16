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
     * @visibility backend
     */
    embeddingProviders: Array<{
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
     * @visibility backend
     */
    vectorStores: Array<{
      /**
       * Vector store ID: pinecone, chromadb
       * @visibility backend
       */
      id: string;
      /**
       * API key for the vector store service
       * @visibility secret
       */
      apiKey?: string;
      /**
       * Base URL (for self-hosted vector stores like ChromaDB)
       * @visibility backend
       */
      baseUrl?: string;
      /**
       * Index name (for Pinecone) or collection name (for others) - REQUIRED
       * @visibility backend
       */
      indexName: string;
      /**
       * Environment (for Pinecone)
       * @visibility backend
       */
      environment?: string;
      /**
       * Additional configuration options
       * @visibility backend
       */
      config?: Record<string, string>;
    }>;
  };
}
