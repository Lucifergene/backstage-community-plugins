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
import { ProviderFactory } from '../providers/provider-factory';
import { getProviderConfig } from '../utils/config-adapter';
import { GeneralChatRequest, GeneralChatResponse, ChatMessage } from '../types';
import { KnowledgeBaseService } from '@internal/backstage-plugin-knowledge-base-backend';
import { SYSTEM_PROMPTS } from '../constants/systemPrompts';

// Type for MCPClientService - using 'any' as workaround until exports are added
// See EXPORT_IMPROVEMENTS.md in mcp-chat-backend for the export plan
type MCPClientServiceType = any;

export class K8sGeneralChatService {
  private readonly logger: LoggerService;
  private readonly config: RootConfigService;
  private readonly llmProvider: any;
  private readonly knowledgeBaseService: KnowledgeBaseService | null;
  private readonly mcpClientService: MCPClientServiceType | null;
  private readonly systemPrompt: string;

  constructor(options: {
    logger: LoggerService;
    config: RootConfigService;
    knowledgeBaseService: KnowledgeBaseService | null;
    mcpClientService?: MCPClientServiceType;
  }) {
    this.logger = options.logger;
    this.config = options.config;
    this.knowledgeBaseService = options.knowledgeBaseService;
    this.mcpClientService = options.mcpClientService || null;

    // Initialize LLM provider
    const providerConfig = getProviderConfig(this.config);
    this.llmProvider = ProviderFactory.createProvider(providerConfig);

    // System prompt for general K8s assistance
    this.systemPrompt = SYSTEM_PROMPTS.GENERAL_CHAT;
  }

  async sendChatMessage(
    request: GeneralChatRequest,
  ): Promise<GeneralChatResponse> {
    this.logger.info('Processing general chat message', {
      enableMCPTools: request.enableMCPTools,
      enableRAG: request.enableRAG,
      messageCount: request.messages.length,
    });

    let conversationMessages: ChatMessage[] = [...request.messages];
    let ragContext: string[] = [];

    // Step 1: Retrieve RAG context if enabled
    if (request.enableRAG && this.knowledgeBaseService) {
      try {
        const lastUserMessage = request.messages
          .filter(m => m.role === 'user')
          .pop();

        if (lastUserMessage && lastUserMessage.content) {
          this.logger.info('Retrieving RAG context for query');

          // Search knowledge base for relevant documents
          const topK = request.ragConfig?.topK || 3; // Default to 3
          const results = await this.knowledgeBaseService.search(
            lastUserMessage.content,
            { topK },
          );

          if (results && results.length > 0) {
            ragContext = results.map((r: any) => r.content);
            this.logger.info(`Retrieved ${ragContext.length} relevant chunks`);

            // Format context with metadata
            const formattedContext = results
              .map((r: any, i: number) => {
                const metadata = r.metadata || {};
                const fileName = metadata.fileName || 'Unknown';
                const score = r.score
                  ? ` (relevance: ${(r.score * 100).toFixed(1)}%)`
                  : '';

                return `[Document ${i + 1}${score}]
Source: ${fileName}
${metadata.format ? `Format: ${metadata.format}` : ''}
${
  metadata.chunkIndex !== undefined
    ? `Chunk: ${metadata.chunkIndex + 1}/${metadata.totalChunks}`
    : ''
}

Content:
${r.content}`;
              })
              .join('\n\n---\n\n');

            // Inject RAG context into system message
            const ragContextMessage: ChatMessage = {
              role: 'system',
              content: `Relevant documentation context retrieved from vector store:

${formattedContext}

Instructions:
- Use this context to provide accurate and detailed answers
- Cite specific documents when appropriate
- If the context doesn't fully answer the question, combine it with your general knowledge`,
            };

            conversationMessages = [ragContextMessage, ...conversationMessages];
          }
        }
      } catch (error) {
        this.logger.warn(
          `Failed to retrieve RAG context: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
        // Continue without RAG context
      }
    }

    // Step 2: Build messages with combined system prompt
    // Combine RAG context (if present) with system prompt into a single system message
    let systemPromptContent = this.systemPrompt;
    let userMessages = conversationMessages;

    // Check if RAG context was added (it would be the first message with role 'system')
    if (
      conversationMessages.length > 0 &&
      conversationMessages[0].role === 'system'
    ) {
      const ragContextMsg = conversationMessages[0];
      // Combine RAG context with system prompt
      systemPromptContent = `${ragContextMsg.content}\n\n---\n\n${this.systemPrompt}`;
      // Remove the RAG system message from user messages
      userMessages = conversationMessages.slice(1);
    }

    const messagesWithSystem: ChatMessage[] = [
      {
        role: 'system',
        content: systemPromptContent,
      },
      ...userMessages,
    ];

    // Step 3: Call LLM (with or without MCP tools)
    try {
      if (request.enableMCPTools && this.mcpClientService) {
        // Delegate entire query processing, including tool calls, to MCPClientService
        const availableTools =
          (this.mcpClientService as any).getAvailableTools?.() || [];
        this.logger.info(
          `Processing chat with MCP tools enabled. Available tools: ${availableTools.length}`,
        );

        const mcpResponse = await this.mcpClientService.processQuery(
          messagesWithSystem,
          [], // Empty array = enable all MCP servers
        );

        // Map QueryResponse (reply, toolCalls, toolResponses) to GeneralChatResponse format
        return {
          role: 'assistant',
          content: mcpResponse.reply,
          toolsUsed:
            mcpResponse.toolCalls?.map(
              (tc: { function: { name: string } }) => tc.function.name,
            ) || undefined,
          toolResponses: mcpResponse.toolResponses || undefined,
          ragContext: ragContext.length > 0 ? ragContext : undefined,
        };
      } else {
        // Fallback to direct LLM call if MCP tools are not enabled
        this.logger.info('Processing chat without MCP tools');

        const llmResponse = await this.llmProvider.sendMessage(
          messagesWithSystem,
          undefined, // No tools
        );

        return {
          role: 'assistant',
          content: llmResponse.choices[0].message.content || '',
          ragContext: ragContext.length > 0 ? ragContext : undefined,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process chat message: ${errorMessage}`);
      throw new Error(`Failed to process chat message: ${errorMessage}`);
    }
  }
}
