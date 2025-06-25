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
import { LLMProvider, ChatMessage, Tool, ChatResponse } from './base-provider';

export class OpenAIProvider extends LLMProvider {
  async sendMessage(
    messages: ChatMessage[],
    tools?: Tool[],
  ): Promise<ChatResponse> {
    const requestBody = this.formatRequest(messages, tools);
    const response = await this.makeRequest('/chat/completions', requestBody);
    return this.parseResponse(response);
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  protected formatRequest(messages: ChatMessage[], tools?: Tool[]): any {
    const request: any = {
      model: this.model,
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    };

    if (tools && tools.length > 0) {
      request.tools = tools;
    }

    return request;
  }

  protected parseResponse(response: any): ChatResponse {
    return response; // OpenAI format is our standard
  }
}
