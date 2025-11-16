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
import { K8sLogService } from './services/K8sLogService';
import { K8sYamlService } from './services/K8sYamlService';
import { K8sAiAssistantService } from './services/K8sAiAssistantService';

describe('createRouter', () => {
  let app: express.Express;
  let mockK8sAiAssistantService: jest.Mocked<K8sAiAssistantService>;
  let mockK8sLogService: jest.Mocked<K8sLogService>;
  let mockK8sYamlService: jest.Mocked<K8sYamlService>;

  beforeEach(async () => {
    mockK8sLogService = {
      explainLogs: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
      getAvailableTools: jest.fn().mockReturnValue([]),
    } as any;

    mockK8sYamlService = {
      generateYaml: jest.fn(),
    } as any;

    mockK8sAiAssistantService = {
      getProviderStatus: jest.fn().mockResolvedValue({
        providers: [
          {
            id: 'gemini',
            model: 'gemini-2.5-flash',
            connection: { connected: true, models: [] },
          },
        ],
        summary: { totalProviders: 1, healthyProviders: 1 },
        timestamp: new Date().toISOString(),
      }),
      getVectorStoreStatus: jest.fn().mockResolvedValue({
        configured: true,
        vectorStore: {
          id: 'pinecone',
          indexName: 'test-index',
          embeddingModel: 'text-embedding-004',
          embeddingDimensions: 768,
          connection: {
            connected: true,
            totalDocuments: 100,
            dimensions: 768,
          },
        },
        summary: { healthy: true },
        timestamp: new Date().toISOString(),
      }),
      getMCPServerStatus: jest.fn().mockResolvedValue({
        total: 1,
        valid: 1,
        active: 1,
        servers: [
          {
            id: 'kubernetes-server',
            name: 'Kubernetes MCP Server',
            type: 'stdio',
            status: { valid: true, connected: true },
          },
        ],
        timestamp: new Date().toISOString(),
      }),
      getAvailableTools: jest.fn().mockReturnValue([
        {
          name: 'pods_log',
          description: 'Get pod logs',
          serverId: 'kubernetes-server',
          serverName: 'Kubernetes MCP Server',
        },
      ]),
    } as any;

    const router = await createRouter({
      logger: mockServices.logger.mock(),
      k8sAiAssistantService: mockK8sAiAssistantService,
      k8sLogService: mockK8sLogService,
      k8sYamlService: mockK8sYamlService,
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  it('should return health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should explain logs', async () => {
    const mockResponse = {
      role: 'assistant' as const,
      content: 'Test explanation',
      toolsUsed: ['kubectl_logs'],
      toolResponses: [],
    };

    mockK8sLogService.explainLogs.mockResolvedValue(mockResponse);

    const response = await request(app)
      .post('/explain-logs')
      .send({
        resourceType: 'Pod',
        resourceName: 'test-pod',
        namespace: 'default',
        logType: 'stdout',
        messages: [{ role: 'user', content: 'Show me errors' }],
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
  });

  it('should reject requests with missing fields', async () => {
    const response = await request(app).post('/explain-logs').send({
      resourceType: 'Pod',
      // missing other required fields
    });

    expect(response.status).toBe(400);
  });

  it('should generate YAML', async () => {
    const mockResponse = {
      role: 'assistant' as const,
      content:
        'Here is a Deployment manifest:\n\n```yaml\napiVersion: apps/v1\nkind: Deployment\n```',
      yamlBlocks: ['apiVersion: apps/v1\nkind: Deployment'],
    };

    mockK8sYamlService.generateYaml.mockResolvedValue(mockResponse);

    const response = await request(app)
      .post('/generate-yaml')
      .send({
        messages: [{ role: 'user', content: 'Generate a Deployment' }],
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
  });

  it('should reject YAML generation requests with missing messages', async () => {
    const response = await request(app).post('/generate-yaml').send({});

    expect(response.status).toBe(400);
  });

  it('should return default values for missing vector store config', async () => {
    // Mock service with no vector store
    const mockServiceNoVectorStore = {
      ...mockK8sAiAssistantService,
      getVectorStoreStatus: jest.fn().mockResolvedValue({
        configured: false,
        summary: { healthy: false },
        timestamp: new Date().toISOString(),
      }),
    } as any;

    const routerNoConfig = await createRouter({
      logger: mockServices.logger.mock(),
      k8sAiAssistantService: mockServiceNoVectorStore,
      k8sLogService: mockK8sLogService,
      k8sYamlService: mockK8sYamlService,
    });
    const appNoConfig = express();
    appNoConfig.use(routerNoConfig);

    const response = await request(appNoConfig).get('/vectorStore/status');

    expect(response.status).toBe(200);
    expect(response.body.configured).toBe(false);
    expect(response.body.vectorStore).toBeUndefined();
  });

  describe('Status Endpoints', () => {
    it('should return provider status', async () => {
      const response = await request(app).get('/provider/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('providers');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.providers).toHaveLength(1);
      expect(response.body.providers[0].id).toBe('gemini');
      expect(response.body.summary.healthyProviders).toBe(1);
    });

    it('should return vector store status', async () => {
      const response = await request(app).get('/vectorStore/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('configured');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.configured).toBe(true);
      expect(response.body.vectorStore).toHaveProperty('id');
      expect(response.body.vectorStore).toHaveProperty('indexName');
      expect(response.body.vectorStore).toHaveProperty('embeddingModel');
      expect(response.body.vectorStore).toHaveProperty('embeddingDimensions');
      expect(response.body.vectorStore).toHaveProperty('connection');
      expect(response.body.vectorStore.id).toBe('pinecone');
      expect(response.body.vectorStore.connection.connected).toBe(true);
    });

    it('should return MCP server status', async () => {
      const response = await request(app).get('/mcp/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('servers');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.total).toBe(1);
      expect(response.body.active).toBe(1);
      expect(response.body.servers).toHaveLength(1);
      expect(response.body.servers[0].id).toBe('kubernetes-server');
    });

    it('should return available tools', async () => {
      const response = await request(app).get('/mcp/tools');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('availableTools');
      expect(response.body).toHaveProperty('toolCount');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.toolCount).toBe(1);
      expect(response.body.availableTools).toHaveLength(1);
      expect(response.body.availableTools[0].name).toBe('pods_log');
    });
  });
});
