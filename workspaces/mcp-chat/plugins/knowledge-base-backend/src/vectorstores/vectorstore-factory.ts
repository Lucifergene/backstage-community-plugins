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
import { VectorStoreProvider, VectorStoreConfig } from './base-vectorstore';
import { PineconeVectorStore } from './pinecone-vectorstore';
import { ChromaDBVectorStore } from './chromadb-vectorstore';

/**
 * Get vector store configuration from Backstage config
 * Reads from knowledgeBase.vectorStores array (first entry is active)
 */
export function getVectorStoreConfig(
  config: RootConfigService,
): VectorStoreConfig | null {
  const vectorStores = config.getOptionalConfigArray(
    'knowledgeBase.vectorStores',
  );

  // If no vector stores configured, return null
  if (!vectorStores || vectorStores.length === 0) {
    return null;
  }

  // Use the first vector store in the array as the active one
  const vectorStoreConfig = vectorStores[0];

  const id = vectorStoreConfig.getOptionalString('id');
  const indexName = vectorStoreConfig.getOptionalString('indexName');

  // Validate required fields
  if (!id || !indexName) {
    throw new Error(
      'Vector store configuration is incomplete. Required fields: id, indexName',
    );
  }

  const apiKey = vectorStoreConfig.getOptionalString('apiKey');
  const baseUrl = vectorStoreConfig.getOptionalString('baseUrl');
  const environment = vectorStoreConfig.getOptionalString('environment');

  // Get additional config as a record
  const additionalConfig: Record<string, string> = {};
  const configKeys = vectorStoreConfig.getOptionalConfig('config');
  if (configKeys) {
    const keys = configKeys.keys();
    for (const key of keys) {
      const value = configKeys.getOptionalString(key);
      if (value) {
        additionalConfig[key] = value;
      }
    }
  }

  return {
    id,
    apiKey,
    baseUrl,
    indexName,
    environment,
    config:
      Object.keys(additionalConfig).length > 0 ? additionalConfig : undefined,
  };
}

/**
 * Factory for creating vector store providers
 */
export class VectorStoreFactory {
  /**
   * Create a vector store provider based on configuration
   */
  static createProvider(config: VectorStoreConfig): VectorStoreProvider {
    const id = config.id.toLowerCase();

    switch (id) {
      case 'pinecone':
        return new PineconeVectorStore(config);

      case 'chromadb':
      case 'chroma':
        return new ChromaDBVectorStore(config);

      // Add more providers here as needed:
      // case 'qdrant':
      //   return new QdrantVectorStore(config);
      // case 'weaviate':
      //   return new WeaviateVectorStore(config);

      default:
        throw new Error(
          `Unsupported vector store provider: ${config.id}. Supported providers: pinecone, chromadb`,
        );
    }
  }

  /**
   * Create a vector store provider from Backstage config
   */
  static createFromConfig(
    config: RootConfigService,
  ): VectorStoreProvider | null {
    const vectorStoreConfig = getVectorStoreConfig(config);

    if (!vectorStoreConfig) {
      return null;
    }

    return VectorStoreFactory.createProvider(vectorStoreConfig);
  }
}

