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
import { startTestBackend, mockServices } from '@backstage/backend-test-utils';
import { k8SAiAssistantPlugin } from './plugin';
import request from 'supertest';

// Plugin tests are integration tests for your plugin, ensuring that all pieces
// work together end-to-end. You can still mock injected backend services
// however, just like anyone who installs your plugin might replace the
// services with their own implementations.
describe('plugin', () => {
  // Create a mock config that provides the required mcpChat configuration
  const mockConfig = mockServices.rootConfig.factory({
    data: {
      mcpChat: {
        providers: [
          {
            id: 'openai',
            token: 'test-api-key',
            model: 'gpt-4',
          },
        ],
        mcpServers: [],
      },
    },
  });

  it('should start the plugin and respond to health check', async () => {
    const { server } = await startTestBackend({
      features: [k8SAiAssistantPlugin, mockConfig],
    });

    // Test the health endpoint
    await request(server)
      .get('/api/k8s-ai-assistant/health')
      .expect(200, { status: 'ok' });
  });

  it('should return provider status', async () => {
    const { server } = await startTestBackend({
      features: [k8SAiAssistantPlugin, mockConfig],
    });

    await request(server)
      .get('/api/k8s-ai-assistant/provider/status')
      .expect(200);
  });

  it('should return MCP server status', async () => {
    const { server } = await startTestBackend({
      features: [k8SAiAssistantPlugin, mockConfig],
    });

    const response = await request(server)
      .get('/api/k8s-ai-assistant/mcp/status')
      .expect(200);

    // Should return MCP status data structure
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('servers');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return available tools', async () => {
    const { server } = await startTestBackend({
      features: [k8SAiAssistantPlugin, mockConfig],
    });

    const response = await request(server)
      .get('/api/k8s-ai-assistant/mcp/tools')
      .expect(200);

    // Should return tools data structure
    expect(response.body).toHaveProperty('availableTools');
    expect(response.body).toHaveProperty('toolCount');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should validate chat request', async () => {
    const { server } = await startTestBackend({
      features: [k8SAiAssistantPlugin, mockConfig],
    });

    // Test with invalid request (missing required fields)
    await request(server)
      .post('/api/k8s-ai-assistant/chat')
      .send({})
      .expect(400);
  });
});
