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

import type {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import type { KnowledgeBaseService } from './service/KnowledgeBaseService';
import { KnowledgeBaseServiceImpl } from './service/KnowledgeBaseServiceImpl';
import { DocumentService } from './service/DocumentService';
import { EmbeddingProviderFactory } from './providers/embedding-provider-factory';
import {
  VectorStoreFactory,
  getVectorStoreConfig,
} from './vectorstores/vectorstore-factory';
import { getEmbeddingProviderConfig } from './utils/config-helper';

/**
 * Options for creating a KnowledgeBaseService
 * @public
 */
export interface CreateKnowledgeBaseServiceOptions {
  logger: LoggerService;
  config: RootConfigService;
}

/**
 * Factory implementation for creating KnowledgeBaseService instances.
 * Initializes embedding providers, vector stores, and document services.
 *
 * @example
 * ```typescript
 * import { createKnowledgeBaseService } from '@internal/plugin-knowledge-base-backend';
 *
 * const kbService = await createKnowledgeBaseService({ logger, config });
 * const results = await kbService.search('kubernetes deployment');
 * ```
 *
 * @public
 */
export async function createKnowledgeBaseService(
  options: CreateKnowledgeBaseServiceOptions,
): Promise<KnowledgeBaseService> {
  const { logger, config } = options;

  const embeddingConfig = getEmbeddingProviderConfig(config);
  const vectorStoreConfig = getVectorStoreConfig(config);

  if (!vectorStoreConfig) {
    throw new Error(
      'Knowledge Base vector store is not configured. ' +
        'Please configure knowledgeBase.vectorStores in app-config.yaml',
    );
  }

  const embeddingProvider = EmbeddingProviderFactory.createProvider(
    embeddingConfig,
    logger,
  );
  const vectorStore = VectorStoreFactory.createProvider(vectorStoreConfig);

  await vectorStore.connect();
  logger.info(
    `Knowledge Base vector store connected: ${vectorStoreConfig.indexName}`,
  );

  const documentService = new DocumentService(
    embeddingProvider,
    vectorStore,
    logger,
  );

  return new KnowledgeBaseServiceImpl(
    embeddingProvider,
    vectorStore,
    documentService,
    logger,
  );
}
