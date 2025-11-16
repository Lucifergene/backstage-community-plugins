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
import { ProviderConfig } from '../types';

// Dynamic import wrapper for mcp-chat-backend providers
// This loads the compiled .cjs.js files from the installed npm package
export class ProviderFactory {
  static createProvider(config: ProviderConfig): any {
    // Load provider implementations from the built package
    // The package publishes .cjs.js files in the dist/providers/ directory
    const { OpenAIProvider } = require('@backstage-community/plugin-mcp-chat-backend/dist/providers/openai-provider.cjs.js');
    const { GeminiProvider } = require('@backstage-community/plugin-mcp-chat-backend/dist/providers/gemini-provider.cjs.js');
    const { ClaudeProvider } = require('@backstage-community/plugin-mcp-chat-backend/dist/providers/claude-provider.cjs.js');
    const { OllamaProvider } = require('@backstage-community/plugin-mcp-chat-backend/dist/providers/ollama-provider.cjs.js');

    switch (config.type) {
      case 'openai':
        return new OpenAIProvider(config);

      case 'gemini':
        return new GeminiProvider(config);

      case 'claude':
        return new ClaudeProvider(config);

      case 'ollama':
        return new OllamaProvider(config);

      default:
        throw new Error(`Unsupported provider: ${config.type}`);
    }
  }
}

