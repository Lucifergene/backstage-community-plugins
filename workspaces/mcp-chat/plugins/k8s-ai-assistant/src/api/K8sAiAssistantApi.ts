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

import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import {
  LogExplainRequest,
  LogExplainResponse,
  YamlGenerateRequest,
  YamlGenerateResponse,
  GeneralChatRequest,
  GeneralChatResponse,
  ProviderStatusData,
  VectorStoreStatusData,
  MCPServerStatusData,
  ToolsResponse,
  ListDocumentsResponse,
  UploadDocumentsRequest,
  UploadDocumentsResponse,
  DeleteDocumentResponse,
} from '../types';

/**
 * API interface for K8s AI Assistant
 * @public
 */
export interface K8sAiAssistantApi {
  /**
   * Explain logs for a Kubernetes resource
   */
  explainLogs(
    request: LogExplainRequest,
    signal?: AbortSignal,
  ): Promise<LogExplainResponse>;

  /**
   * Generate YAML manifest
   */
  generateYaml(
    request: YamlGenerateRequest,
    signal?: AbortSignal,
  ): Promise<YamlGenerateResponse>;

  /**
   * Send general chat message with MCP and RAG support
   */
  sendChatMessage(
    request: GeneralChatRequest,
    signal?: AbortSignal,
  ): Promise<GeneralChatResponse>;

  /**
   * Get LLM provider status
   */
  getProviderStatus(): Promise<ProviderStatusData>;

  /**
   * Get vector store status and embedding configuration
   */
  getVectorStoreStatus(): Promise<VectorStoreStatusData>;

  /**
   * Get MCP server status
   */
  getMCPServerStatus(): Promise<MCPServerStatusData>;

  /**
   * Get available MCP tools
   */
  getAvailableTools(): Promise<ToolsResponse>;

  /**
   * List uploaded documents
   */
  listDocuments(namespace?: string): Promise<ListDocumentsResponse>;

  /**
   * List only YAML documents
   */
  listYamlDocuments(namespace?: string): Promise<ListDocumentsResponse>;

  /**
   * Upload documents to vector store
   */
  uploadDocuments(
    request: UploadDocumentsRequest,
  ): Promise<UploadDocumentsResponse>;

  /**
   * Delete a document from vector store by fileName
   */
  deleteDocument(fileName: string): Promise<DeleteDocumentResponse>;
}

/**
 * Implementation of K8sAiAssistantApi
 * @public
 */
export class K8sAiAssistant implements K8sAiAssistantApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async explainLogs(
    request: LogExplainRequest,
    signal?: AbortSignal,
  ): Promise<LogExplainResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl('k8s-ai-assistant');

    const response = await this.fetchApi.fetch(`${baseUrl}/explain-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  async generateYaml(
    request: YamlGenerateRequest,
    signal?: AbortSignal,
  ): Promise<YamlGenerateResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl('k8s-ai-assistant');

    const response = await this.fetchApi.fetch(`${baseUrl}/generate-yaml`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  async sendChatMessage(
    request: GeneralChatRequest,
    signal?: AbortSignal,
  ): Promise<GeneralChatResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl('k8s-ai-assistant');

    const response = await this.fetchApi.fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  async getProviderStatus(): Promise<ProviderStatusData> {
    const baseUrl = await this.discoveryApi.getBaseUrl('k8s-ai-assistant');

    const response = await this.fetchApi.fetch(`${baseUrl}/provider/status`);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  async getVectorStoreStatus(): Promise<VectorStoreStatusData> {
    const baseUrl = await this.discoveryApi.getBaseUrl('k8s-ai-assistant');

    const response = await this.fetchApi.fetch(`${baseUrl}/vectorStore/status`);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  async getMCPServerStatus(): Promise<MCPServerStatusData> {
    const baseUrl = await this.discoveryApi.getBaseUrl('k8s-ai-assistant');

    const response = await this.fetchApi.fetch(`${baseUrl}/mcp/status`);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  async getAvailableTools(): Promise<ToolsResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl('k8s-ai-assistant');

    const response = await this.fetchApi.fetch(`${baseUrl}/mcp/tools`);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  async listDocuments(namespace?: string): Promise<ListDocumentsResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl('k8s-ai-assistant');
    const params = namespace
      ? `?namespace=${encodeURIComponent(namespace)}`
      : '';

    const response = await this.fetchApi.fetch(
      `${baseUrl}/list-documents${params}`,
    );

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  async listYamlDocuments(namespace?: string): Promise<ListDocumentsResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl('k8s-ai-assistant');
    const params = namespace
      ? `?namespace=${encodeURIComponent(namespace)}`
      : '';

    const response = await this.fetchApi.fetch(
      `${baseUrl}/documents/yaml${params}`,
    );

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  async uploadDocuments(
    request: UploadDocumentsRequest,
  ): Promise<UploadDocumentsResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl('k8s-ai-assistant');

    const response = await this.fetchApi.fetch(`${baseUrl}/upload-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  async deleteDocument(fileName: string): Promise<DeleteDocumentResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl('k8s-ai-assistant');

    const response = await this.fetchApi.fetch(
      `${baseUrl}/documents/${encodeURIComponent(fileName)}`,
      {
        method: 'DELETE',
      },
    );

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }
}
