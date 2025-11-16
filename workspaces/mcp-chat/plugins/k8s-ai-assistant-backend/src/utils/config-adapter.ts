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
 * Get provider config from shared mcpChat config namespace
 *
 * Expected config format (shared with other MCP plugins):
 * mcpChat:
 *   providers:
 *     - id: openai
 *       token: ${OPENAI_API_KEY}
 *       model: gpt-4
 *
 * k8sAiAssistant:
 *   embeddingProvider:
 *     model: text-embedding-ada-002
 *     dimensions: 1536
 */
export function getProviderConfig(config: RootConfigService): ProviderConfig {
  const providers = config.getOptionalConfigArray('mcpChat.providers');

  if (!providers || providers.length === 0) {
    throw new Error(
      'mcpChat.providers configuration is required. ' +
        'Expected format: mcpChat.providers[0] with id, token, and model fields.',
    );
  }

  // Use the first provider, similar to mcp-chat-backend
  const providerConfig = providers[0];
  const providerId = providerConfig.getString('id');
  const token = providerConfig.getOptionalString('token');
  const model = providerConfig.getString('model');
  const baseUrl = providerConfig.getOptionalString('baseUrl');

  const allowedProviders = ['openai', 'gemini', 'claude', 'ollama'];
  if (!allowedProviders.includes(providerId)) {
    throw new Error(
      `Unsupported provider id: ${providerId}. Allowed values are: ${allowedProviders.join(
        ', ',
      )}`,
    );
  }

  const configs: Record<string, Partial<ProviderConfig>> = {
    openai: {
      type: 'openai',
      apiKey: token,
      baseUrl: baseUrl || 'https://api.openai.com/v1',
      model: model,
    },
    gemini: {
      type: 'gemini',
      apiKey: token,
      baseUrl: 'https://generativelanguage.googleapis.com',
      model: model,
    },
    claude: {
      type: 'claude',
      apiKey: token,
      baseUrl: 'https://api.anthropic.com/v1',
      model: model,
    },
    ollama: {
      type: 'ollama',
      baseUrl: baseUrl || 'http://localhost:11434',
      model: model,
    },
  };

  const configTemplate = configs[providerId];
  if (!configTemplate) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  // Validate required fields
  if (providerId !== 'ollama' && !configTemplate.apiKey) {
    throw new Error(`API key is required for provider: ${providerId}`);
  }
  if (!configTemplate.model) {
    throw new Error(`Model is required for provider: ${providerId}`);
  }

  return configTemplate as ProviderConfig;
}

// Embedding provider config has been moved to knowledge-base-backend plugin
// Use getKnowledgeBaseService() from @internal/backstage-plugin-knowledge-base-backend instead

/**
 * Export provider info for status display
 */
export function getProviderInfo(config: RootConfigService) {
  const providerConfig = getProviderConfig(config);
  return {
    provider: providerConfig.type,
    model: providerConfig.model,
    baseURL: providerConfig.baseUrl,
  };
}
