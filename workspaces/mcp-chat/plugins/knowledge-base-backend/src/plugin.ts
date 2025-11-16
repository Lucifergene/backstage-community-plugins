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
import { createBackendPlugin, coreServices } from '@backstage/backend-plugin-api';
import { getKnowledgeBaseService } from './service';

/**
 * Knowledge Base backend plugin
 *
 * This plugin provides RAG (Retrieval-Augmented Generation) capabilities
 * including embedding providers and vector stores for knowledge retrieval.
 *
 * @public
 */
export const knowledgeBasePlugin = createBackendPlugin({
  pluginId: 'knowledge-base',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ logger, config }) {
        logger.info('Initializing Knowledge Base backend plugin');

        try {
          // Initialize the knowledge base service
          // This validates configuration and connects to vector store
          const kbService = await getKnowledgeBaseService({ logger, config });

          // Get status to verify everything is working
          const status = await kbService.getStatus();
          logger.info(
            `Knowledge Base initialized: ${status.embeddingProvider?.id} + ${status.vectorStore?.id}`,
          );

          if (!status.embeddingProvider?.connected) {
            logger.warn(
              `Embedding provider not connected: ${status.embeddingProvider?.error}`,
            );
          }

          if (!status.vectorStore?.connected) {
            logger.warn(
              `Vector store not connected: ${status.vectorStore?.error}`,
            );
          }

          logger.info('Knowledge Base backend plugin initialized successfully');
        } catch (error) {
          logger.error(
            `Failed to initialize Knowledge Base backend: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
          // Don't throw - let the plugin start even if KB is not configured
          // This allows other plugins to work without KB being required
        }
      },
    });
  },
});

