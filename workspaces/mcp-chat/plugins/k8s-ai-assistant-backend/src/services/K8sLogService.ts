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
import { LoggerService } from '@backstage/backend-plugin-api';
import { LogExplainRequest, LogExplainResponse } from '../types';
import { SYSTEM_PROMPTS } from '../constants/systemPrompts';

// Type for MCPClientService - using 'any' as workaround until exports are added
// See EXPORT_IMPROVEMENTS.md in mcp-chat-backend for the export plan
type MCPClientServiceType = any;

export class K8sLogService {
  private readonly logger: LoggerService;
  private readonly mcpClientService: MCPClientServiceType;
  private readonly systemPrompt: string;

  constructor(options: {
    logger: LoggerService;
    mcpClientService: MCPClientServiceType;
  }) {
    this.logger = options.logger;
    this.mcpClientService = options.mcpClientService;
    this.systemPrompt = SYSTEM_PROMPTS.LOG_ANALYSIS;
  }

  /**
   * Get available MCP tools from shared service
   */
  getAvailableTools() {
    return this.mcpClientService.getAvailableTools();
  }

  /**
   * Check if MCP servers are connected
   */
  isConnected(): boolean {
    const tools = this.mcpClientService.getAvailableTools();
    return tools.length > 0;
  }

  async explainLogs(request: LogExplainRequest): Promise<LogExplainResponse> {
    // Determine if this is the initial request or a follow-up
    const isInitialRequest =
      request.messages.length === 1 && request.messages[0].role === 'user';

    let messages: any[];

    if (isInitialRequest) {
      // First message: Add system context and initial user message
      const systemMessage = {
        role: 'system',
        content: `${this.systemPrompt}

You have access to Kubernetes tools. Use the 'pods_log' tool to fetch logs for the requested resource and then analyze them.

Context:
- Resource: ${request.resourceType}/${request.resourceName}
- Namespace: ${request.namespace}
- Log Type: ${request.logType}`,
      };

      // Create user message requesting log analysis
      const userMessage = {
        role: 'user',
        content: `Please fetch the logs for pod "${
          request.resourceName
        }" in namespace "${request.namespace}"${
          request.logType === 'stderr' ? ' (previous/stderr logs)' : ''
        } and analyze them. ${
          request.messages[0]?.content ||
          'Identify any errors, warnings, or issues and provide troubleshooting guidance.'
        }`,
      };

      messages = [systemMessage, userMessage];
    } else {
      // Follow-up message: Use full conversation history from request
      // The system context and previous exchanges are already in request.messages
      messages = request.messages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls && { tool_calls: m.tool_calls }),
        ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
      }));
    }

    // Enable all MCP servers (empty array = all tools available)
    // The MCPClientService filters by server IDs, not tool names
    const enabledServers: string[] = [];

    this.logger.info(
      `Processing log analysis request for ${request.resourceType}/${
        request.resourceName
      } in namespace ${request.namespace} (${
        isInitialRequest ? 'initial' : 'follow-up'
      })`,
    );

    try {
      // Use MCPClientService to process the query (it will call tools as needed)
      const response = await this.mcpClientService.processQuery(
        messages,
        enabledServers,
      );

      // Map QueryResponse (reply, toolCalls, toolResponses) to LogExplainResponse format
      return {
        role: 'assistant',
        content: response.reply,
        toolsUsed: response.toolCalls?.map((tc: any) => tc.function.name) || [],
        toolResponses: response.toolResponses || [],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to analyze logs: ${errorMessage}`);
      throw new Error(`Failed to analyze logs: ${errorMessage}`);
    }
  }
}
