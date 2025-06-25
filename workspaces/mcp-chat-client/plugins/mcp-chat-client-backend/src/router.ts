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
  HttpAuthService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import {
  ServerConfig,
  MCPClientService,
} from './services/MCPClientService/types';

// Helper function to load server configurations from app-config
function loadServerConfigs(config: RootConfigService): ServerConfig[] {
  const mcpServers = config.getOptionalConfigArray('mcpChat.mcpServers') || [];

  return mcpServers.map(serverConfig => {
    let headers: Record<string, string> | undefined;
    if (serverConfig.has('headers')) {
      const headersConfig = serverConfig.getConfig('headers').get();
      if (headersConfig && typeof headersConfig === 'object') {
        headers = Object.fromEntries(
          Object.entries(headersConfig as Record<string, any>).map(
            ([key, value]) => [key, String(value)],
          ),
        );
      }
    }

    let env: Record<string, string> | undefined;
    if (serverConfig.has('env')) {
      const envConfig = serverConfig.getConfig('env').get();
      if (envConfig && typeof envConfig === 'object') {
        env = Object.fromEntries(
          Object.entries(envConfig as Record<string, any>).map(
            ([key, value]) => [key, String(value)],
          ),
        );
      }
    }

    return {
      id: serverConfig.getOptionalString('id'),
      name: serverConfig.getString('name'),
      scriptPath: serverConfig.getOptionalString('scriptPath'),
      npxCommand: serverConfig.getOptionalString('npxCommand'),
      args: serverConfig.getOptionalStringArray('args'),
      env,
      url: serverConfig.getOptionalString('url'),
      headers,
      type: serverConfig.getOptionalString('type') as
        | 'stdio'
        | 'sse'
        | 'streamable-http'
        | undefined,
    };
  });
}

export async function createRouter({
  mcpClientService,
  config,
}: {
  httpAuth: HttpAuthService;
  mcpClientService: MCPClientService;
  config: RootConfigService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  // Configuration status endpoint
  router.get('/config/status', async (_req, res) => {
    try {
      const providerStatus = mcpClientService.getProviderStatus();
      const mcpServers =
        config.getOptionalConfigArray('mcpChat.mcpServers') || [];
      const serverList = mcpServers.map(serverConfig => ({
        id: serverConfig.getOptionalString('id'),
        name: serverConfig.getString('name'),
        type: serverConfig.getOptionalString('type') || 'stdio',
        hasUrl: serverConfig.has('url'),
        hasNpxCommand: serverConfig.has('npxCommand'),
        hasScriptPath: serverConfig.has('scriptPath'),
      }));

      res.json({
        provider: providerStatus,
        mcpServers: serverList,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get configuration status',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // MCP Chat route
  router.post('/chat', async (req, res) => {
    try {
      const { messages, enabledTools = [] } = req.body;

      // Validate messages array
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'No query provided' });
      }

      const userQuery = messages[messages.length - 1]?.content;

      if (!userQuery) {
        return res.status(400).json({ error: 'No query provided' });
      }

      const serverConfigs = loadServerConfigs(config);
      await mcpClientService.initMCP(serverConfigs);

      const { reply, toolCalls, toolResponses } =
        await mcpClientService.processQuery(messages, enabledTools);

      if (toolCalls.length > 0) {
        const toolInfo = toolCalls
          .map(call => `${call.function.name}`)
          .join(', ');

        const combinedContent = `**Tools used:** ${toolInfo}\n\n---\n\n${reply}`;

        return res.json({
          role: 'assistant',
          content: combinedContent,
          toolResponses,
        });
      }
      return res.json({
        role: 'assistant',
        content: reply,
        toolResponses: [],
      });
    } catch (err) {
      console.error('[MCP Error]', err);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  });

  // Test route with fixed prompt
  router.get('/test/latest-news', async (_req, res) => {
    try {
      console.log('Test route called: /test/latest-news');

      // Dynamically get current month and year
      const now = new Date();
      const currentMonth = now.toLocaleString('en-US', { month: 'long' });
      const currentYear = now.getFullYear();

      // Fixed test prompt for current month news
      const testPrompt = `Get the latest news from ${currentMonth} ${currentYear}. Show me the top 5 recent news stories from this month.`;
      const messages = [
        {
          role: 'user',
          content: testPrompt,
        },
      ];

      const serverConfigs = loadServerConfigs(config);
      console.log(
        'Loaded server configs:',
        serverConfigs.map(c => ({ name: c.name, type: c.type })),
      );

      // Initialize MCP with all available tools (no filtering)
      await mcpClientService.initMCP(serverConfigs);
      console.log('MCP initialized successfully');

      // Process the query with all available tools enabled
      const { reply, toolCalls, toolResponses } =
        await mcpClientService.processQuery(messages, []);

      console.log('Tool calls made:', toolCalls.length);
      console.log('Tool responses:', toolResponses.length);

      // Detailed response for testing
      const testResponse = {
        prompt: testPrompt,
        reply,
        toolCalls: toolCalls.map(call => ({
          id: call.id,
          toolName: call.function.name,
          arguments: JSON.parse(call.function.arguments),
        })),
        toolResponses: toolResponses.map(response => ({
          toolName: response.toolName,
          result: response.result,
          success: response.success,
        })),
        serverConfigs: serverConfigs.map(c => ({
          name: c.name,
          type: c.type || 'stdio',
          hasUrl: !!c.url,
          hasNpxCommand: !!c.npxCommand,
        })),
      };

      if (toolCalls.length > 0) {
        const toolInfo = toolCalls
          .map(call => `${call.function.name}`)
          .join(', ');

        const combinedContent = `**Tools used:** ${toolInfo}\n\n---\n\n${reply}`;

        return res.json({
          ...testResponse,
          role: 'assistant',
          content: combinedContent,
        });
      }
      return res.json({
        ...testResponse,
        role: 'assistant',
        content: reply,
        warning:
          'No tools were called - this might indicate an issue with tool discovery or LLM understanding',
      });
    } catch (err) {
      console.error('[MCP Test Error]', err);
      return res.status(500).json({
        error: 'Test failed',
        details: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
  });

  // Test route to check available tools
  router.get('/test/tools', async (_req, res) => {
    try {
      console.log('Test route called: /test/tools');

      const serverConfigs = loadServerConfigs(config);
      console.log(
        'Loaded server configs for tools check:',
        serverConfigs.map(c => ({ name: c.name, type: c.type })),
      );

      // Initialize MCP to get available tools
      await mcpClientService.initMCP(serverConfigs);
      console.log('MCP initialized for tools check');

      // Simple message to trigger tool listing without actually calling them
      const testMessages = [
        {
          role: 'user',
          content: 'What tools are available?',
        },
      ];

      // Process query but focus on seeing available tools
      const { reply } = await mcpClientService.processQuery(testMessages, []);

      return res.json({
        message: 'Tools check completed',
        serverConfigs: serverConfigs.map(c => ({
          name: c.name,
          type: c.type || 'stdio',
          hasUrl: !!c.url,
          hasNpxCommand: !!c.npxCommand,
          hasScriptPath: !!c.scriptPath,
        })),
        llmReply: reply,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[MCP Tools Check Error]', err);
      return res.status(500).json({
        error: 'Tools check failed',
        details: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
  });

  return router;
}

/*
 * Updated app-config.yaml example for Brave Search:
 *
 * mcpChat:
 *   providers:
 *     - id: openai
 *       token: ${OPENAI_API_KEY}
 *       model: gpt-4o-mini
 *   mcpServers:
 *     - id: brave-search-server
 *       name: Brave Search Server
 *       npxCommand: '@modelcontextprotocol/server-brave-search@latest'
 *       env:
 *         BRAVE_API_KEY: ${BRAVE_API_KEY}
 *     - id: backstage-server
 *       name: Backstage Server
 *       url: 'http://localhost:7007/api/mcp-actions/v1'
 *       headers:
 *         Authorization: 'Bearer PVwjB59lWS0raDM/SKpitTmp7J7k6/Am'
 */
