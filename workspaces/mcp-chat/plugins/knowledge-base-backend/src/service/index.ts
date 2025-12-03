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
import { LlamaStackKnowledgeBaseService } from './LlamaStackKnowledgeBaseService';
import { DocumentService } from './DocumentService';
import { EmbeddingProviderFactory } from '../providers/embedding-provider-factory';
import {
  VectorStoreFactory,
  getVectorStoreConfig,
} from '../vectorstores/vectorstore-factory';
import {
  getEmbeddingProviderConfig,
  getLlamaStackConfig,
} from '../utils/config-helper';

/**
 * Factory function to create a KnowledgeBaseService instance.
 *
 * Priority order:
 * 1. If knowledgeBase.llamastack is configured, use LlamaStackKnowledgeBaseService
 * 2. Otherwise, use standard KnowledgeBaseServiceImpl with embedding provider + vector store
 *
 * This allows Llama Stack to coexist with Pinecone/ChromaDB configurations.
 *
 * @public
 */
export async function getKnowledgeBaseService(deps: {
  logger: LoggerService;
  config: RootConfigService;
}): Promise<KnowledgeBaseService> {
  const { logger, config } = deps;

  // Check for Llama Stack configuration first
  const llamaStackConfig = getLlamaStackConfig(config);
  if (llamaStackConfig) {
    logger.info(
      `Using Llama Stack knowledge base with vector store: ${llamaStackConfig.vectorStoreId}`,
    );
    return new LlamaStackKnowledgeBaseService(llamaStackConfig, logger);
  }

  // Fall back to standard embedding provider + vector store configuration
  logger.info(
    'Llama Stack not configured, using standard embedding provider + vector store',
  );

  const embeddingConfig = getEmbeddingProviderConfig(config);
  const vectorStoreConfig = getVectorStoreConfig(config);

  if (!vectorStoreConfig) {
    throw new Error(
      'Knowledge Base vector store is not configured. ' +
        'Please configure knowledgeBase.vectorStores or knowledgeBase.llamastack in app-config.yaml',
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

export type { KnowledgeBaseService } from './KnowledgeBaseService';
export { DocumentService } from './DocumentService';
export type { ChunkSettings, UploadedDocument } from './DocumentService';
