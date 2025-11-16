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

// =============================================================================
// Log Explanation API Types
// =============================================================================

export interface LogExplainRequest {
  resourceType: string; // 'Pod', 'Deployment', etc.
  resourceName: string; // Name of the resource
  namespace: string; // Kubernetes namespace
  logType: 'stdout' | 'stderr' | 'both';
  messages: ChatMessage[]; // Conversation history
}

// =============================================================================
// YAML Generation API Types
// =============================================================================

export interface YamlGenerateRequest {
  messages: ChatMessage[]; // Conversation history
  enableRAG?: boolean; // Whether to enable RAG context from YAML examples
  ragConfig?: RagConfig; // Optional RAG configuration
}

export interface YamlGenerateResponse {
  role: 'assistant';
  content: string; // AI response with YAML
  yamlBlocks?: string[]; // Extracted YAML blocks
  ragContext?: string[]; // Documents used from RAG
}

// =============================================================================
// General Chat API Types
// =============================================================================

export interface RagConfig {
  topK?: number; // Number of documents to retrieve (default: 3)
}

export interface GeneralChatRequest {
  messages: ChatMessage[]; // Conversation history
  enableMCPTools: boolean; // Whether to enable K8s MCP tools
  enableRAG: boolean; // Whether to enable RAG context
  ragConfig?: RagConfig; // Optional RAG configuration
}

export interface GeneralChatResponse {
  role: 'assistant';
  content: string; // AI response
  toolsUsed?: string[]; // List of tools called
  toolResponses?: any[]; // Tool response data
  ragContext?: string[]; // Documents used from RAG
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
}

export interface LogExplainResponse {
  role: 'assistant';
  content: string; // AI explanation
  toolsUsed?: string[]; // Tools called (e.g., ['kubectl_logs'])
  toolResponses?: any[]; // Raw tool responses
}

// =============================================================================
// LLM Provider Configuration Types
// =============================================================================

// Note: We extend the ProviderConfig from mcp-chat-backend with embedding-specific fields
// The base ProviderConfig is used for LLM providers, while we add embedding fields for RAG
export interface ProviderConfig {
  type: string;
  apiKey?: string;
  baseUrl: string;
  model: string;
  // K8s-specific extensions for embedding providers
  embeddingModel?: string;
  dimensions?: number;
}

// =============================================================================
// K8s Server Configuration Types
// =============================================================================

export interface K8sServerConfig {
  npxCommand?: string;
  scriptPath?: string;
  env?: Record<string, string>;
}

// =============================================================================
// Tool Types
// =============================================================================

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

// =============================================================================
// Chat Response Types
// =============================================================================

export interface ChatResponse {
  choices: [
    {
      message: {
        role: 'assistant';
        content: string | null;
        tool_calls?: ToolCall[];
      };
    },
  ];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// =============================================================================
// Provider Status Types
// =============================================================================

export interface ProviderConnectionStatus {
  connected: boolean;
  models?: string[];
  error?: string;
}

export interface Provider {
  id: string;
  model: string;
  baseUrl?: string;
  connection: ProviderConnectionStatus;
}

export interface ProviderStatusData {
  providers: Provider[];
  summary: {
    totalProviders: number;
    healthyProviders: number;
    error?: string;
  };
  timestamp: string;
}

// =============================================================================
// Vector Store Status Types
// =============================================================================

export interface VectorStoreConnectionStatus {
  connected: boolean;
  totalDocuments?: number;
  dimensions?: number;
  error?: string;
}

export interface VectorStoreInfo {
  id: string;
  indexName: string;
  embeddingModel: string;
  embeddingDimensions: number;
  connection: VectorStoreConnectionStatus;
}

export interface VectorStoreStatusData {
  configured: boolean;
  vectorStore?: VectorStoreInfo;
  summary: {
    healthy: boolean;
    error?: string;
  };
  timestamp: string;
}

// =============================================================================
// MCP Server Status Types
// =============================================================================

export interface MCPServerStatus {
  id: string;
  name: string;
  type: 'stdio' | 'http' | 'sse';
  status: {
    valid: boolean;
    connected: boolean;
    error?: string;
  };
}

export interface MCPServerStatusData {
  total: number;
  valid: number;
  active: number;
  servers: MCPServerStatus[];
  timestamp: string;
}

// =============================================================================
// Tool Types
// =============================================================================

export interface ServerTool {
  name: string;
  description: string;
  serverId: string;
  serverName: string;
  inputSchema?: any;
}

// =============================================================================
// Document List Types
// =============================================================================

export enum FileFormat {
  YAML = 'yaml',
  PDF = 'pdf',
  TEXT = 'text',
  MARKDOWN = 'markdown',
}

export interface DocumentInfo {
  fileName: string;
  format: FileFormat;
  kind?: string;
  apiVersion?: string;
  namespace?: string;
  chunkCount: number;
  uploadedAt: string;
  totalSize: number;
  pageCount?: number;
  author?: string;
  lineCount?: number;
}

export interface ListDocumentsResponse {
  success: boolean;
  documents: DocumentInfo[];
  totalDocuments: number;
  timestamp: string;
}

// =============================================================================
// Document Delete Types
// =============================================================================

export interface DeleteDocumentResponse {
  success: boolean;
  deletedCount: number;
  fileName: string;
  timestamp: string;
}
