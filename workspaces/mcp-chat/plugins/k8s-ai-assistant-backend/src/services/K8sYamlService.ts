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
import {
  YamlGenerateRequest,
  YamlGenerateResponse,
  ChatMessage,
  FileFormat,
} from '../types';
import { KnowledgeBaseService } from '@internal/backstage-plugin-knowledge-base-backend';
import { SYSTEM_PROMPTS } from '../constants/systemPrompts';

export class K8sYamlService {
  private readonly logger: LoggerService;
  private readonly llmProvider: any;
  private readonly knowledgeBaseService: KnowledgeBaseService | null;
  private readonly systemPrompt: string;

  constructor(options: {
    logger: LoggerService;
    config: RootConfigService;
    llmProvider: any;
    knowledgeBaseService: KnowledgeBaseService | null;
  }) {
    this.logger = options.logger;
    this.llmProvider = options.llmProvider;
    this.knowledgeBaseService = options.knowledgeBaseService;
    this.systemPrompt = SYSTEM_PROMPTS.YAML_GENERATION;
  }

  async generateYaml(
    request: YamlGenerateRequest,
  ): Promise<YamlGenerateResponse> {
    // Determine if this is the initial request or a follow-up
    const isInitialRequest = request.messages.length === 1 && 
                             request.messages[0].role === 'user';

    this.logger.info(`Generating YAML with LLM (${isInitialRequest ? 'initial' : 'follow-up'})`, {
      enableRAG: request.enableRAG,
      messageCount: request.messages.length,
    });

    let ragContext: string[] = [];
    let messages: ChatMessage[];

    if (isInitialRequest) {
      // First message: Build system prompt with optional RAG context
      let systemPromptContent = this.systemPrompt;

      // Step 1: Retrieve RAG context if enabled
      if (request.enableRAG && this.knowledgeBaseService) {
        try {
          const lastUserMessage = request.messages
            .filter(m => m.role === 'user')
            .pop();

          if (lastUserMessage && lastUserMessage.content) {
            this.logger.info('Retrieving RAG context for YAML generation');

            // Search knowledge base for relevant YAML examples
            const topK = request.ragConfig?.topK || 3;
            const results = await this.knowledgeBaseService.search(
              lastUserMessage.content,
              { topK, filter: { format: FileFormat.YAML } },
            );

            if (results && results.length > 0) {
              // Filter to only YAML documents
              const yamlResults = results.filter(
                (r: any) => r.metadata?.format === FileFormat.YAML,
              );

              if (yamlResults.length > 0) {
                ragContext = yamlResults.map((r: any) => r.content);
                this.logger.info(
                  `Retrieved ${ragContext.length} YAML examples for context`,
                );

                // Format YAML examples for the prompt
                const formattedExamples = yamlResults
                  .map((r: any, i: number) => {
                    const metadata = r.metadata || {};
                    const fileName = metadata.fileName || 'Unknown';
                    const kind = metadata.kind || 'Resource';
                    const apiVersion = metadata.apiVersion || '';

                    return `Example ${i + 1} - ${fileName}:
Kind: ${kind}
ApiVersion: ${apiVersion}

${r.content}`;
                  })
                  .join('\n\n---\n\n');

                // Enhance system prompt with examples
                systemPromptContent = `${this.systemPrompt}

IMPORTANT - Reference Examples:
You have access to the following YAML examples from the user's knowledge base. Use these as reference patterns when generating new manifests:

${formattedExamples}

Use these examples to:
- Match the style and structure
- Apply similar best practices
- Maintain consistent naming conventions
- Follow the same patterns for labels, annotations, and configurations

Generate new YAML that follows these patterns while adapting to the user's specific requirements.`;
              }
            }
          }
        } catch (error) {
          this.logger.warn(
            `Failed to retrieve RAG context for YAML: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          // Continue without RAG context
        }
      }

      // Build messages with system prompt
      const contextMessage: ChatMessage = {
        role: 'system',
        content: systemPromptContent,
      };

      messages = [contextMessage, ...request.messages];
    } else {
      // Follow-up message: Use full conversation history from request
      // The system context and previous exchanges are already in request.messages
      messages = request.messages;
    }

    // Step 3: Generate YAML with LLM
    const llmResponse = await this.llmProvider.sendMessage(messages, []);

    const content = llmResponse.choices[0].message.content || '';
    const yamlBlocks = this.extractYamlBlocks(content);

    return {
      role: 'assistant',
      content,
      yamlBlocks,
      ragContext,
    };
  }

  private extractYamlBlocks(content: string): string[] {
    const yamlRegex = /```(?:yaml|yml)\n([\s\S]*?)```/g;
    const blocks: string[] = [];
    let match;

    while ((match = yamlRegex.exec(content)) !== null) {
      blocks.push(match[1].trim());
    }

    return blocks;
  }
}
