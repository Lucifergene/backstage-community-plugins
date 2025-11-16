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

/**
 * Knowledge Base backend plugin
 *
 * @packageDocumentation
 */

// Export plugin
export { knowledgeBasePlugin as default } from './plugin';
export { knowledgeBasePlugin } from './plugin';

// Export service interface and factory for other plugins
export type { KnowledgeBaseService } from './service';
export { getKnowledgeBaseService } from './service';
export type { ChunkSettings, UploadedDocument } from './service';

// Export types that consumers might need
export type {
  DocumentInfo,
  SearchOptions,
  SearchResult,
  KnowledgeBaseStatus,
  FileFormat,
  ProviderConfig,
  EmbeddingProviderStatus,
  VectorStoreStatus,
} from './types';

// Export provider interfaces for advanced usage
export { EmbeddingProvider } from './providers/base-embedding-provider';
export type {
  VectorStoreProvider,
  VectorStoreDocument,
  VectorStoreQueryResult,
  VectorStoreConfig,
} from './vectorstores/base-vectorstore';

