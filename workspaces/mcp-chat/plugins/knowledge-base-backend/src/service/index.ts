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
import { getEmbeddingProviderConfig } from '../utils/config-helper';

/**
 * Factory for creating KnowledgeBaseService instances.
 * Supports llamastack, pinecone, and chromadb vector stores.
 * @public
 */
export async function getKnowledgeBaseService(deps: {
  logger: LoggerService;
  config: RootConfigService;
}): Promise<KnowledgeBaseService> {
  const { logger, config } = deps;

  const vectorStoreConfig = getVectorStoreConfig(config);

  if (!vectorStoreConfig) {
    throw new Error(
      'Knowledge Base vector store is not configured. ' +
        'Please configure knowledgeBase.vectorStores in app-config.yaml',
    );
  }

  if (vectorStoreConfig.id.toLowerCase() === 'llamastack') {
    logger.info(
      `Using LlamaStack knowledge base with vector store: ${vectorStoreConfig.vectorStoreId}`,
    );
    return new LlamaStackKnowledgeBaseService(
      {
        baseUrl: vectorStoreConfig.baseUrl!,
        vectorStoreId: vectorStoreConfig.vectorStoreId!,
        token: vectorStoreConfig.token,
        chunkingStrategy: vectorStoreConfig.chunkingStrategy || 'static',
        maxChunkSizeTokens: vectorStoreConfig.maxChunkSizeTokens || 200,
        chunkOverlapTokens: vectorStoreConfig.chunkOverlapTokens || 50,
      },
      logger,
    );
  }

  logger.info(
    `Using ${vectorStoreConfig.id} vector store with embedding provider`,
  );

  const embeddingConfig = getEmbeddingProviderConfig(config);
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
