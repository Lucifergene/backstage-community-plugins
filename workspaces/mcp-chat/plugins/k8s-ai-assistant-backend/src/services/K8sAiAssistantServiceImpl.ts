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
import { K8sAiAssistantService } from './K8sAiAssistantService';
import {
  ProviderStatusData,
  VectorStoreStatusData,
  MCPServerStatusData,
  ServerTool,
} from '../types';
import { ProviderFactory } from '../providers/provider-factory';
import { getProviderConfig } from '../utils/config-adapter';
import { KnowledgeBaseService } from '@internal/backstage-plugin-knowledge-base-backend';

// Type for MCPClientService - using 'any' as workaround until exports are added
// See EXPORT_IMPROVEMENTS.md in mcp-chat-backend for the export plan
type MCPClientServiceType = any;

export class K8sAiAssistantServiceImpl implements K8sAiAssistantService {
  private readonly logger: LoggerService;
  private readonly config: RootConfigService;
  private mcpClientService: MCPClientServiceType | null = null;
  private knowledgeBaseService: KnowledgeBaseService | null = null;

  constructor(options: {
    logger: LoggerService;
    config: RootConfigService;
    knowledgeBaseService?: KnowledgeBaseService | null;
  }) {
    this.logger = options.logger;
    this.config = options.config;
    this.knowledgeBaseService = options.knowledgeBaseService || null;
  }

  setMCPClientService(service: MCPClientServiceType) {
    this.mcpClientService = service;
  }

  async getProviderStatus(): Promise<ProviderStatusData> {
    try {
      const providerConfig = getProviderConfig(this.config);
      const provider = ProviderFactory.createProvider(providerConfig);

      // Test connection
      const testResult = await provider.testConnection();

      const providers = [
        {
          id: providerConfig.type,
          model: providerConfig.model,
          baseUrl: providerConfig.baseUrl,
          connection: {
            connected: testResult.connected,
            models: testResult.models || [],
            error: testResult.error,
          },
        },
      ];

      return {
        providers,
        summary: {
          totalProviders: 1,
          healthyProviders: testResult.connected ? 1 : 0,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Provider status check failed: ${error}`);
      return {
        providers: [],
        summary: {
          totalProviders: 0,
          healthyProviders: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getVectorStoreStatus(): Promise<VectorStoreStatusData> {
    // Vector store status is now handled by the knowledge-base-backend plugin
    if (!this.knowledgeBaseService) {
      return {
        configured: false,
        summary: {
          healthy: false,
        },
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Get status from knowledge base service
      const kbStatus = await this.knowledgeBaseService.getStatus();

      if (!kbStatus.configured) {
        return {
          configured: false,
          summary: {
            healthy: false,
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        configured: true,
        vectorStore: {
          id: kbStatus.vectorStore?.id || 'unknown',
          indexName: kbStatus.vectorStore?.indexName || 'unknown',
          embeddingModel: kbStatus.embeddingProvider?.model || 'Not configured',
          embeddingDimensions: kbStatus.embeddingProvider?.dimensions || 0,
          connection: {
            connected: kbStatus.vectorStore?.connected || false,
            totalDocuments: kbStatus.vectorStore?.totalDocuments,
            dimensions: kbStatus.vectorStore?.dimensions,
            error: kbStatus.vectorStore?.error,
          },
        },
        summary: {
          healthy: kbStatus.vectorStore?.connected || false,
        },
        timestamp: kbStatus.timestamp,
      };
    } catch (error) {
      this.logger.error(`Vector store status check failed: ${error}`);

      return {
        configured: true,
        vectorStore: {
          id: 'unknown',
          indexName: 'unknown',
          embeddingModel: 'Not configured',
          embeddingDimensions: 0,
          connection: {
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        summary: {
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getMCPServerStatus(): Promise<MCPServerStatusData> {
    if (!this.mcpClientService) {
      return {
        total: 0,
        valid: 0,
        active: 0,
        servers: [],
        timestamp: new Date().toISOString(),
      };
    }

    // Delegate to MCPClientService to get status of all MCP servers
    try {
      const status = await this.mcpClientService.getMCPServerStatus();
      return status;
    } catch (error) {
      this.logger.error(`Failed to get MCP server status: ${error}`);
      return {
        total: 0,
        valid: 0,
        active: 0,
        servers: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  getAvailableTools(): ServerTool[] {
    if (!this.mcpClientService) {
      return [];
    }

    // Delegate to MCPClientService to get all available tools
    return this.mcpClientService.getAvailableTools();
  }
}
