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
import { mockErrorHandler, mockServices } from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import {
  MCPClientService,
  ServerConfig,
} from './services/MCPClientService/types';
import { ToolCall } from './services/MCPClientService/providers/base-provider';

describe('createRouter', () => {
  let app: express.Express;
  let mcpClientService: jest.Mocked<MCPClientService>;
  let mockConfig: any;

  const mockServerConfigs: ServerConfig[] = [
    {
      id: 'brave-search',
      name: 'Brave Search Server',
      npxCommand: '@modelcontextprotocol/server-brave-search@latest',
      type: 'stdio',
      env: { BRAVE_API_KEY: 'test-key' },
    },
    {
      id: 'backstage-server',
      name: 'Backstage Server',
      url: 'http://localhost:7007/api/mcp-actions/v1',
      type: 'sse',
      headers: { Authorization: 'Bearer test-token' },
    },
  ];

  const mockToolCall: ToolCall = {
    id: 'call_123',
    type: 'function',
    function: {
      name: 'search_web',
      arguments: JSON.stringify({ query: 'test query' }),
    },
  };

  const mockToolResponse = {
    toolName: 'search_web',
    result: 'Search results here',
    success: true,
  };

  beforeEach(async () => {
    // Mock MCPClientService
    mcpClientService = {
      initMCP: jest.fn().mockResolvedValue(undefined),
      processQuery: jest.fn().mockResolvedValue({
        reply: 'Test response',
        toolCalls: [],
        toolResponses: [],
      }),
      getProviderConfig: jest.fn().mockReturnValue({
        id: 'openai',
        model: 'gpt-4o-mini',
      }),
      getProviderStatus: jest.fn().mockReturnValue({
        connected: true,
        provider: 'openai',
        model: 'gpt-4o-mini',
      }),
    };

    // Mock config service
    mockConfig = {
      getOptionalConfigArray: jest.fn().mockReturnValue([
        {
          getOptionalString: jest.fn((key: string) => {
            const config = mockServerConfigs[0];
            return config[key as keyof ServerConfig];
          }),
          getString: jest.fn((key: string) => {
            const config = mockServerConfigs[0];
            return config[key as keyof ServerConfig];
          }),
          getOptionalStringArray: jest.fn(() => undefined),
          has: jest.fn((key: string) => {
            return key === 'env' || key === 'npxCommand';
          }),
          getConfig: jest.fn((_key: string) => ({
            get: jest.fn(() => mockServerConfigs[0].env),
          })),
        },
        {
          getOptionalString: jest.fn((key: string) => {
            const config = mockServerConfigs[1];
            return config[key as keyof ServerConfig];
          }),
          getString: jest.fn((key: string) => {
            const config = mockServerConfigs[1];
            return config[key as keyof ServerConfig];
          }),
          getOptionalStringArray: jest.fn(() => undefined),
          has: jest.fn((key: string) => {
            return key === 'headers' || key === 'url';
          }),
          getConfig: jest.fn((_key: string) => ({
            get: jest.fn(() => mockServerConfigs[1].headers),
          })),
        },
      ]),
    };

    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      mcpClientService,
      config: mockConfig,
    });

    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  describe('GET /config/status', () => {
    it('should return configuration status successfully', async () => {
      const response = await request(app).get('/config/status');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        provider: {
          connected: true,
          provider: 'openai',
          model: 'gpt-4o-mini',
        },
        mcpServers: [
          {
            id: 'brave-search',
            name: 'Brave Search Server',
            type: 'stdio',
            hasUrl: false,
            hasNpxCommand: true,
            hasScriptPath: false,
          },
          {
            id: 'backstage-server',
            name: 'Backstage Server',
            type: 'sse',
            hasUrl: true,
            hasNpxCommand: false,
            hasScriptPath: false,
          },
        ],
      });
      expect(mcpClientService.getProviderStatus).toHaveBeenCalled();
    });

    it('should handle configuration errors gracefully', async () => {
      mcpClientService.getProviderStatus.mockImplementation(() => {
        throw new Error('Provider connection failed');
      });

      const response = await request(app).get('/config/status');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to get configuration status',
        details: 'Provider connection failed',
      });
    });

    it('should handle empty server configurations', async () => {
      mockConfig.getOptionalConfigArray.mockReturnValue([]);

      const response = await request(app).get('/config/status');

      expect(response.status).toBe(200);
      expect(response.body.mcpServers).toEqual([]);
    });
  });

  describe('POST /chat', () => {
    const validChatRequest = {
      messages: [
        { role: 'user', content: 'Hello, what can you help me with?' },
      ],
      enabledTools: ['search_web'],
    };

    it('should process chat request without tools successfully', async () => {
      mcpClientService.processQuery.mockResolvedValue({
        reply: 'Hello! I can help you with various tasks.',
        toolCalls: [],
        toolResponses: [],
      });

      const response = await request(app).post('/chat').send(validChatRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        role: 'assistant',
        content: 'Hello! I can help you with various tasks.',
        toolResponses: [],
      });
      expect(mcpClientService.initMCP).toHaveBeenCalled();
      expect(mcpClientService.processQuery).toHaveBeenCalledWith(
        validChatRequest.messages,
        validChatRequest.enabledTools,
      );
    });

    it('should process chat request with tools successfully', async () => {
      mcpClientService.processQuery.mockResolvedValue({
        reply: 'I found some search results for you.',
        toolCalls: [mockToolCall],
        toolResponses: [mockToolResponse],
      });

      const response = await request(app).post('/chat').send(validChatRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        role: 'assistant',
        content:
          '**Tools used:** search_web\n\n---\n\nI found some search results for you.',
        toolResponses: [mockToolResponse],
      });
    });

    it('should handle multiple tool calls', async () => {
      const multipleToolCalls: ToolCall[] = [
        mockToolCall,
        {
          id: 'call_456',
          type: 'function',
          function: {
            name: 'get_weather',
            arguments: JSON.stringify({ location: 'San Francisco' }),
          },
        },
      ];

      mcpClientService.processQuery.mockResolvedValue({
        reply: 'I used multiple tools to help you.',
        toolCalls: multipleToolCalls,
        toolResponses: [mockToolResponse],
      });

      const response = await request(app).post('/chat').send(validChatRequest);

      expect(response.status).toBe(200);
      expect(response.body.content).toContain(
        '**Tools used:** search_web, get_weather',
      );
    });

    it('should return 400 for empty messages array', async () => {
      const response = await request(app).post('/chat').send({
        messages: [],
        enabledTools: [],
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'No query provided',
      });
    });

    it('should return 400 for messages without content', async () => {
      const response = await request(app)
        .post('/chat')
        .send({
          messages: [{ role: 'user' }],
          enabledTools: [],
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'No query provided',
      });
    });

    it('should handle missing enabledTools parameter', async () => {
      mcpClientService.processQuery.mockResolvedValue({
        reply: 'Response without enabled tools',
        toolCalls: [],
        toolResponses: [],
      });

      const response = await request(app)
        .post('/chat')
        .send({
          messages: [{ role: 'user', content: 'Test message' }],
        });

      expect(response.status).toBe(200);
      expect(mcpClientService.processQuery).toHaveBeenCalledWith(
        [{ role: 'user', content: 'Test message' }],
        [],
      );
    });

    it('should handle MCP initialization errors', async () => {
      mcpClientService.initMCP.mockRejectedValue(new Error('MCP init failed'));

      const response = await request(app).post('/chat').send(validChatRequest);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Something went wrong',
      });
    });

    it('should handle query processing errors', async () => {
      mcpClientService.processQuery.mockRejectedValue(
        new Error('Query processing failed'),
      );

      const response = await request(app).post('/chat').send(validChatRequest);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Something went wrong',
      });
    });
  });

  describe('GET /test/latest-news', () => {
    it('should return latest news with tool responses', async () => {
      mcpClientService.processQuery.mockResolvedValue({
        reply: 'Here are the latest news stories from this month.',
        toolCalls: [mockToolCall],
        toolResponses: [mockToolResponse],
      });

      const response = await request(app).get('/test/latest-news');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        role: 'assistant',
        content: expect.stringContaining('**Tools used:** search_web'),
        prompt: expect.stringContaining('Get the latest news from'),
        toolCalls: [
          {
            id: 'call_123',
            toolName: 'search_web',
            arguments: { query: 'test query' },
          },
        ],
        toolResponses: [mockToolResponse],
        serverConfigs: expect.arrayContaining([
          expect.objectContaining({
            name: 'Brave Search Server',
            type: 'stdio',
          }),
        ]),
      });
    });

    it('should return news response without tools', async () => {
      mcpClientService.processQuery.mockResolvedValue({
        reply: 'Unable to fetch news at this time.',
        toolCalls: [],
        toolResponses: [],
      });

      const response = await request(app).get('/test/latest-news');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        role: 'assistant',
        content: 'Unable to fetch news at this time.',
        warning: expect.stringContaining('No tools were called'),
      });
    });

    it('should handle test route errors', async () => {
      mcpClientService.initMCP.mockRejectedValue(new Error('Init failed'));

      const response = await request(app).get('/test/latest-news');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        error: 'Test failed',
        details: 'Init failed',
      });
    });

    it('should generate prompt with current month and year', async () => {
      const now = new Date();
      const currentMonth = now.toLocaleString('en-US', { month: 'long' });
      const currentYear = now.getFullYear();

      mcpClientService.processQuery.mockResolvedValue({
        reply: 'News response',
        toolCalls: [],
        toolResponses: [],
      });

      const response = await request(app).get('/test/latest-news');

      expect(response.status).toBe(200);
      expect(response.body.prompt).toContain(`${currentMonth} ${currentYear}`);
    });
  });

  describe('GET /test/tools', () => {
    it('should return tools check information', async () => {
      mcpClientService.processQuery.mockResolvedValue({
        reply: 'Available tools: search_web, get_weather',
        toolCalls: [],
        toolResponses: [],
      });

      const response = await request(app).get('/test/tools');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: 'Tools check completed',
        serverConfigs: expect.arrayContaining([
          {
            name: 'Brave Search Server',
            type: 'stdio',
            hasUrl: false,
            hasNpxCommand: true,
            hasScriptPath: false,
          },
          {
            name: 'Backstage Server',
            type: 'sse',
            hasUrl: true,
            hasNpxCommand: false,
            hasScriptPath: false,
          },
        ]),
        llmReply: 'Available tools: search_web, get_weather',
        timestamp: expect.any(String),
      });
    });

    it('should handle tools check errors', async () => {
      mcpClientService.processQuery.mockRejectedValue(
        new Error('Tools check failed'),
      );

      const response = await request(app).get('/test/tools');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        error: 'Tools check failed',
        details: 'Tools check failed',
      });
    });
  });

  describe('Server Configuration Loading', () => {
    it('should handle complex server configurations', async () => {
      const complexConfig = [
        {
          getOptionalString: jest.fn((key: string) => {
            const mapping: Record<string, any> = {
              id: 'complex-server',
              scriptPath: '/path/to/script.js',
              type: 'stdio',
            };
            return mapping[key];
          }),
          getString: jest.fn(() => 'Complex Server'),
          getOptionalStringArray: jest.fn((key: string) => {
            return key === 'args' ? ['--verbose', '--debug'] : undefined;
          }),
          has: jest.fn(
            (key: string) =>
              key === 'env' || key === 'headers' || key === 'scriptPath',
          ),
          getConfig: jest.fn((key: string) => ({
            get: jest.fn(() => {
              if (key === 'env') {
                return { NODE_ENV: 'test', DEBUG: 'true' };
              }
              if (key === 'headers') {
                return { 'X-API-Key': 'test-key' };
              }
              return {};
            }),
          })),
        },
      ];

      mockConfig.getOptionalConfigArray.mockReturnValue(complexConfig);

      const response = await request(app).get('/config/status');

      expect(response.status).toBe(200);
      expect(response.body.mcpServers).toContainEqual({
        id: 'complex-server',
        name: 'Complex Server',
        type: 'stdio',
        hasUrl: false,
        hasNpxCommand: false,
        hasScriptPath: true,
      });
    });

    it('should handle server configs without optional fields', async () => {
      const minimalConfig = [
        {
          getOptionalString: jest.fn((key: string) => {
            return key === 'name' ? undefined : undefined;
          }),
          getString: jest.fn(() => 'Minimal Server'),
          getOptionalStringArray: jest.fn(() => undefined),
          has: jest.fn(() => false),
          getConfig: jest.fn(() => ({ get: jest.fn(() => ({})) })),
        },
      ];

      mockConfig.getOptionalConfigArray.mockReturnValue(minimalConfig);

      const response = await request(app).get('/config/status');

      expect(response.status).toBe(200);
      expect(response.body.mcpServers).toContainEqual({
        id: undefined,
        name: 'Minimal Server',
        type: 'stdio',
        hasUrl: false,
        hasNpxCommand: false,
        hasScriptPath: false,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in requests', async () => {
      const response = await request(app)
        .post('/chat')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    it('should handle unknown tool call errors', async () => {
      mcpClientService.processQuery.mockRejectedValue(
        new Error('Unknown tool: non_existent_tool'),
      );

      const response = await request(app)
        .post('/chat')
        .send({
          messages: [{ role: 'user', content: 'Use unknown tool' }],
          enabledTools: ['non_existent_tool'],
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Something went wrong',
      });
    });

    it('should handle provider configuration errors', async () => {
      mcpClientService.getProviderStatus.mockImplementation(() => {
        throw new Error('Provider not configured');
      });

      const response = await request(app).get('/config/status');

      expect(response.status).toBe(500);
      expect(response.body.details).toBe('Provider not configured');
    });
  });

  describe('Request Validation', () => {
    it('should handle requests with extra fields', async () => {
      mcpClientService.processQuery.mockResolvedValue({
        reply: 'Response',
        toolCalls: [],
        toolResponses: [],
      });

      const response = await request(app)
        .post('/chat')
        .send({
          messages: [{ role: 'user', content: 'Test' }],
          enabledTools: [],
          extraField: 'should be ignored',
        });

      expect(response.status).toBe(200);
    });

    it('should handle messages with various roles', async () => {
      mcpClientService.processQuery.mockResolvedValue({
        reply: 'Response',
        toolCalls: [],
        toolResponses: [],
      });

      const response = await request(app)
        .post('/chat')
        .send({
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
            { role: 'user', content: 'How are you?' },
          ],
          enabledTools: [],
        });

      expect(response.status).toBe(200);
      expect(mcpClientService.processQuery).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'How are you?' }),
        ]),
        [],
      );
    });
  });

  describe('Edge Cases and Additional Coverage', () => {
    it('should handle empty tool responses array', async () => {
      mcpClientService.processQuery.mockResolvedValue({
        reply: 'Response with empty tool responses',
        toolCalls: [mockToolCall],
        toolResponses: [],
      });

      const response = await request(app)
        .post('/chat')
        .send({
          messages: [{ role: 'user', content: 'Test with empty responses' }],
          enabledTools: ['search_web'],
        });

      expect(response.status).toBe(200);
      expect(response.body.toolResponses).toEqual([]);
      expect(response.body.content).toContain('**Tools used:** search_web');
    });

    it('should handle very long message content', async () => {
      const longContent = 'A'.repeat(10000);
      mcpClientService.processQuery.mockResolvedValue({
        reply: 'Processed long message',
        toolCalls: [],
        toolResponses: [],
      });

      const response = await request(app)
        .post('/chat')
        .send({
          messages: [{ role: 'user', content: longContent }],
          enabledTools: [],
        });

      expect(response.status).toBe(200);
      expect(response.body.content).toBe('Processed long message');
    });

    it('should handle special characters in messages', async () => {
      const specialContent =
        '{"test": "value", "special": "éñôdîñg & symbols!@#$%^&*()"}';
      mcpClientService.processQuery.mockResolvedValue({
        reply: 'Processed special characters',
        toolCalls: [],
        toolResponses: [],
      });

      const response = await request(app)
        .post('/chat')
        .send({
          messages: [{ role: 'user', content: specialContent }],
          enabledTools: [],
        });

      expect(response.status).toBe(200);
      expect(response.body.content).toBe('Processed special characters');
    });

    it('should handle large enabledTools array', async () => {
      const manyTools = Array.from({ length: 100 }, (_, i) => `tool_${i}`);
      mcpClientService.processQuery.mockResolvedValue({
        reply: 'Processed with many enabled tools',
        toolCalls: [],
        toolResponses: [],
      });

      const response = await request(app)
        .post('/chat')
        .send({
          messages: [{ role: 'user', content: 'Test with many tools' }],
          enabledTools: manyTools,
        });

      expect(response.status).toBe(200);
      expect(mcpClientService.processQuery).toHaveBeenCalledWith(
        expect.any(Array),
        manyTools,
      );
    });

    it('should handle null content in messages', async () => {
      const response = await request(app)
        .post('/chat')
        .send({
          messages: [{ role: 'user', content: null }],
          enabledTools: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No query provided');
    });

    it('should handle tool call with invalid JSON arguments', async () => {
      const invalidToolCall: ToolCall = {
        id: 'call_invalid',
        type: 'function',
        function: {
          name: 'invalid_tool',
          arguments: 'invalid json {',
        },
      };

      mcpClientService.processQuery.mockResolvedValue({
        reply: 'Tool called with invalid arguments',
        toolCalls: [invalidToolCall],
        toolResponses: [],
      });

      const response = await request(app)
        .post('/chat')
        .send({
          messages: [{ role: 'user', content: 'Test invalid tool args' }],
          enabledTools: ['invalid_tool'],
        });

      expect(response.status).toBe(200);
      expect(response.body.content).toContain('**Tools used:** invalid_tool');
    });

    it('should handle config with mixed server types', async () => {
      const mixedConfigs = [
        {
          getOptionalString: jest.fn((key: string) => {
            const mapping: Record<string, string> = {
              id: 'stdio-server',
              scriptPath: '/path/to/script.js',
              type: 'stdio',
            };
            return mapping[key];
          }),
          getString: jest.fn(() => 'STDIO Server'),
          getOptionalStringArray: jest.fn(() => ['--arg1', '--arg2']),
          has: jest.fn((key: string) => key === 'scriptPath' || key === 'args'),
          getConfig: jest.fn(() => ({ get: jest.fn(() => ({})) })),
        },
        {
          getOptionalString: jest.fn((key: string) => {
            const mapping: Record<string, string> = {
              id: 'sse-server',
              url: 'http://example.com/sse',
              type: 'sse',
            };
            return mapping[key];
          }),
          getString: jest.fn(() => 'SSE Server'),
          getOptionalStringArray: jest.fn(() => undefined),
          has: jest.fn((key: string) => key === 'url'),
          getConfig: jest.fn(() => ({ get: jest.fn(() => ({})) })),
        },
        {
          getOptionalString: jest.fn((key: string) => {
            const mapping: Record<string, string> = {
              id: 'http-server',
              url: 'http://example.com/http',
              type: 'streamable-http',
            };
            return mapping[key];
          }),
          getString: jest.fn(() => 'HTTP Server'),
          getOptionalStringArray: jest.fn(() => undefined),
          has: jest.fn((key: string) => key === 'url'),
          getConfig: jest.fn(() => ({ get: jest.fn(() => ({})) })),
        },
      ];

      mockConfig.getOptionalConfigArray.mockReturnValue(mixedConfigs);

      const response = await request(app).get('/config/status');

      expect(response.status).toBe(200);
      expect(response.body.mcpServers).toHaveLength(3);
      expect(response.body.mcpServers).toContainEqual(
        expect.objectContaining({ name: 'STDIO Server', type: 'stdio' }),
      );
      expect(response.body.mcpServers).toContainEqual(
        expect.objectContaining({ name: 'SSE Server', type: 'sse' }),
      );
      expect(response.body.mcpServers).toContainEqual(
        expect.objectContaining({
          name: 'HTTP Server',
          type: 'streamable-http',
        }),
      );
    });

    it('should handle timeout errors from MCP service', async () => {
      mcpClientService.initMCP.mockRejectedValue(
        new Error('Connection timeout'),
      );

      const response = await request(app)
        .post('/chat')
        .send({
          messages: [{ role: 'user', content: 'Test timeout' }],
          enabledTools: [],
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Something went wrong');
    });

    it('should handle concurrent chat requests', async () => {
      mcpClientService.processQuery.mockResolvedValue({
        reply: 'Concurrent response',
        toolCalls: [],
        toolResponses: [],
      });

      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/chat')
          .send({
            messages: [{ role: 'user', content: `Concurrent message ${i}` }],
            enabledTools: [],
          }),
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.content).toBe('Concurrent response');
      });
      expect(mcpClientService.initMCP).toHaveBeenCalledTimes(5);
      expect(mcpClientService.processQuery).toHaveBeenCalledTimes(5);
    });
  });

  describe('Configuration Error Scenarios', () => {
    it('should handle malformed server configuration', async () => {
      mockConfig.getOptionalConfigArray.mockImplementation(() => {
        throw new Error('Invalid configuration format');
      });

      const response = await request(app).get('/config/status');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to get configuration status');
      expect(response.body.details).toBe('Invalid configuration format');
    });

    it('should handle missing required configuration fields', async () => {
      const invalidConfig = [
        {
          getOptionalString: jest.fn(() => undefined),
          getString: jest.fn(() => {
            throw new Error('Required field missing');
          }),
          getOptionalStringArray: jest.fn(() => undefined),
          has: jest.fn(() => false),
          getConfig: jest.fn(() => ({ get: jest.fn(() => ({})) })),
        },
      ];

      mockConfig.getOptionalConfigArray.mockReturnValue(invalidConfig);

      const response = await request(app).get('/config/status');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to get configuration status');
    });
  });
});
