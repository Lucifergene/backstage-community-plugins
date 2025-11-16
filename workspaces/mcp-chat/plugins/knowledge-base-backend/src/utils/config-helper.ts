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
import { RootConfigService } from '@backstage/backend-plugin-api';
import { ProviderConfig } from '../types';

/**
 * Get embedding provider config from knowledgeBase namespace
 *
 * Expected config format:
 * knowledgeBase:
 *   embeddingProviders:
 *     - id: gemini
 *       token: ${GEMINI_API_KEY}
 *       model: text-embedding-004
 *       dimensions: 768
 *     - id: openai
 *       token: ${OPENAI_API_KEY}
 *       model: text-embedding-ada-002
 *       dimensions: 1536
 *
 * The first provider in the array is used as the active provider.
 */
export function getEmbeddingProviderConfig(
  config: RootConfigService,
): ProviderConfig {
  const embeddingProviders = config.getOptionalConfigArray(
    'knowledgeBase.embeddingProviders',
  );

  if (!embeddingProviders || embeddingProviders.length === 0) {
    throw new Error(
      'knowledgeBase.embeddingProviders configuration is required for RAG/vector store features. ' +
        'Expected format: embeddingProviders array with id, token, model, and dimensions fields.',
    );
  }

  // Use the first provider in the array
  const embeddingConfig = embeddingProviders[0];

  const providerId = embeddingConfig.getString('id');
  const token = embeddingConfig.getOptionalString('token');
  const model = embeddingConfig.getString('model');
  const dimensions = embeddingConfig.getOptionalNumber('dimensions');
  const baseUrl = embeddingConfig.getOptionalString('baseUrl');

  const allowedProviders = ['openai', 'gemini'];
  if (!allowedProviders.includes(providerId)) {
    throw new Error(
      `Unsupported embedding provider id: ${providerId}. Allowed values are: ${allowedProviders.join(
        ', ',
      )}`,
    );
  }

  // Build config based on provider type
  const configs: Record<string, Partial<ProviderConfig>> = {
    openai: {
      type: 'openai',
      apiKey: token,
      baseUrl: baseUrl || 'https://api.openai.com/v1',
      model: model,
      embeddingModel: model,
      dimensions: dimensions,
    },
    gemini: {
      type: 'gemini',
      apiKey: token,
      baseUrl: 'https://generativelanguage.googleapis.com',
      model: model,
      embeddingModel: model,
      dimensions: dimensions,
    },
  };

  const configTemplate = configs[providerId];
  if (!configTemplate) {
    throw new Error(`Unknown embedding provider: ${providerId}`);
  }

  // Validate required fields
  if (!configTemplate.apiKey) {
    throw new Error(
      `API key (token) is required for embedding provider: ${providerId}`,
    );
  }
  if (!configTemplate.embeddingModel) {
    throw new Error(`Model is required for embedding provider: ${providerId}`);
  }
  if (!configTemplate.dimensions) {
    throw new Error(
      `Dimensions are required for embedding provider: ${providerId}`,
    );
  }

  return configTemplate as ProviderConfig;
}

