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
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { K8sLogService } from './services/K8sLogService';
import { K8sYamlService } from './services/K8sYamlService';
import { K8sGeneralChatService } from './services/K8sGeneralChatService';
import { K8sAiAssistantServiceImpl } from './services/K8sAiAssistantServiceImpl';
import { ProviderFactory } from './providers/provider-factory';
import { getProviderConfig } from './utils/config-adapter';
import { getKnowledgeBaseService } from '@internal/backstage-plugin-knowledge-base-backend';

// Import MCPClientServiceImpl from mcp-chat-backend
// Using require as workaround until proper exports are added to the package
// See EXPORT_IMPROVEMENTS.md in mcp-chat-backend for the export plan
const MCPClientServiceImplModule = require('@backstage-community/plugin-mcp-chat-backend/dist/services/MCPClientServiceImpl.cjs.js');
const MCPClientServiceImpl = MCPClientServiceImplModule.MCPClientServiceImpl || MCPClientServiceImplModule.default || MCPClientServiceImplModule;

/**
 * k8SAiAssistantPlugin backend plugin
 *
 * @public
 */
export const k8SAiAssistantPlugin = createBackendPlugin({
  pluginId: 'k8s-ai-assistant',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        httpRouter: coreServices.httpRouter,
      },
      async init({ logger, httpRouter, config }) {
        // Initialize shared MCP Client Service (handles all MCP servers)
        logger.info('Initializing shared MCP Client Service');
        const mcpClientService = new MCPClientServiceImpl({ logger, config });
        
        // Initialize MCP servers
        try {
          const servers = await mcpClientService.initializeMCPServers();
          logger.info(`MCP servers initialized: ${servers.length} servers configured`);
          servers.forEach((server: any) => {
            logger.info(`  - ${server.name}: ${server.status.connected ? 'connected' : 'failed'}`);
          });
        } catch (error) {
          logger.error(`Failed to initialize MCP servers: ${error}`);
        }

        // Initialize Knowledge Base Service (handles embeddings + vector stores)
        let knowledgeBaseService = null;
        try {
          knowledgeBaseService = await getKnowledgeBaseService({ logger, config });
          logger.info('Knowledge Base service initialized successfully');
        } catch (error) {
          logger.warn(
            `Knowledge Base not configured - RAG features will not be available: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
        }

        // Initialize K8s AI Assistant Service (with Knowledge Base service)
        const k8sAiAssistantService = new K8sAiAssistantServiceImpl({
          logger,
          config,
          knowledgeBaseService,
        });

        // Initialize K8s Log Service (with MCPClientService injection)
        const k8sLogService = new K8sLogService({ 
          logger,
          mcpClientService,
        });

        // Link MCP Client Service
        k8sAiAssistantService.setMCPClientService(mcpClientService);

        // Initialize shared LLM provider for YAML generation
        const providerConfig = getProviderConfig(config);
        const llmProvider = ProviderFactory.createProvider(providerConfig);

        // Initialize K8s YAML Service (with KnowledgeBaseService injection)
        const k8sYamlService = new K8sYamlService({
          logger,
          config,
          llmProvider,
          knowledgeBaseService,
        });

        // Initialize K8s General Chat Service (with MCPClientService and KnowledgeBaseService injection)
        const k8sGeneralChatService = new K8sGeneralChatService({
          logger,
          config,
          knowledgeBaseService,
          mcpClientService,
        });

        // Register HTTP routes
        httpRouter.use(
          await createRouter({
            logger,
            k8sAiAssistantService,
            k8sLogService,
            k8sYamlService,
            k8sGeneralChatService,
            knowledgeBaseService,
          }),
        );
        httpRouter.addAuthPolicy({
          path: '/',
          allow: 'unauthenticated',
        });

        // Note: cleanup will be handled when the process exits
        logger.info('K8s AI Assistant backend initialized');
      },
    });
  },
});
