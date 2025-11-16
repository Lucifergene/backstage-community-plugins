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
import {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { KnowledgeBaseService } from './KnowledgeBaseService';
import { KnowledgeBaseServiceImpl } from './KnowledgeBaseServiceImpl';
import { DocumentService } from './DocumentService';
import { EmbeddingProviderFactory } from '../providers/embedding-provider-factory';
import {
  VectorStoreFactory,
  getVectorStoreConfig,
} from '../vectorstores/vectorstore-factory';
import { getEmbeddingProviderConfig } from '../utils/config-helper';

/**
 * Factory function to create a KnowledgeBaseService instance
 *
 * This is the main entry point for other plugins to get the Knowledge Base service.
 *
 * @example
 * ```typescript
 * import { getKnowledgeBaseService } from '@internal/plugin-knowledge-base-backend';
 *
 * const kbService = await getKnowledgeBaseService({ logger, config });
 * const results = await kbService.search('kubernetes deployment');
 * ```
 */
export async function getKnowledgeBaseService(deps: {
  logger: LoggerService;
  config: RootConfigService;
}): Promise<KnowledgeBaseService> {
  const { logger, config } = deps;

  // Read configuration from knowledgeBase namespace
  const embeddingConfig = getEmbeddingProviderConfig(config);
  const vectorStoreConfig = getVectorStoreConfig(config);

  if (!vectorStoreConfig) {
    throw new Error(
      'Knowledge Base vector store is not configured. ' +
        'Please configure knowledgeBase.vectorStores in app-config.yaml',
    );
  }

  // Create providers
  const embeddingProvider = EmbeddingProviderFactory.createProvider(
    embeddingConfig,
    logger,
  );
  const vectorStore = VectorStoreFactory.createProvider(vectorStoreConfig);

  // Connect to vector store
  await vectorStore.connect();
  logger.info(
    `Knowledge Base vector store connected: ${vectorStoreConfig.indexName}`,
  );

  // Create document service
  const documentService = new DocumentService(
    embeddingProvider,
    vectorStore,
    logger,
  );

  // Return service implementation
  return new KnowledgeBaseServiceImpl(
    embeddingProvider,
    vectorStore,
    documentService,
    logger,
  );
}

// Re-export service interface for consumers
export type { KnowledgeBaseService } from './KnowledgeBaseService';
export { DocumentService } from './DocumentService';
export type { ChunkSettings, UploadedDocument } from './DocumentService';

