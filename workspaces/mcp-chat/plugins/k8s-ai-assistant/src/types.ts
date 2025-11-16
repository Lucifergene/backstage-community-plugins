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
// Chat Message Types
// =============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
}

// =============================================================================
// Log Explanation Types
// =============================================================================

export interface LogExplainRequest {
  resourceType: string;
  resourceName: string;
  namespace: string;
  logType: 'stdout' | 'stderr' | 'both';
  messages: ChatMessage[];
}

export interface LogExplainResponse {
  role: 'assistant';
  content: string;
  toolsUsed?: string[];
  toolResponses?: any[];
}

// =============================================================================
// YAML Generation Types
// =============================================================================

export interface YamlGenerateRequest {
  messages: ChatMessage[];
  enableRAG?: boolean;
  ragConfig?: RagConfig;
}

export interface YamlGenerateResponse {
  role: 'assistant';
  content: string;
  yamlBlocks?: string[];
  ragContext?: string[];
}

// =============================================================================
// General Chat Types
// =============================================================================

export interface RagConfig {
  topK?: number;
}

export interface GeneralChatRequest {
  messages: ChatMessage[];
  enableMCPTools: boolean;
  enableRAG: boolean;
  ragConfig?: RagConfig;
}

export interface GeneralChatResponse {
  role: 'assistant';
  content: string;
  toolsUsed?: string[];
  toolResponses?: any[];
  ragContext?: string[];
}

// =============================================================================
// Status Types
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

export interface ServerTool {
  name: string;
  description: string;
  serverId: string;
  serverName: string;
  inputSchema?: any;
}

export interface ToolsResponse {
  availableTools: ServerTool[];
  toolCount: number;
  timestamp: string;
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

export interface UploadFileData {
  fileName: string;
  content: string;
}

export interface ChunkSettings {
  maxChunkLength: number;
  chunkOverlap: number;
  delimiter: string;
}

export interface UploadDocumentsRequest {
  files: UploadFileData[];
  chunkSettings: ChunkSettings;
}

export interface UploadDocumentsResponse {
  success: boolean;
  uploadedDocuments?: any[];
  totalUploaded: number;
  totalFailed: number;
  timestamp: string;
  error?: string;
  details?: string;
}

export interface DeleteDocumentResponse {
  success: boolean;
  deletedCount: number;
  fileName: string;
  timestamp: string;
}

// =============================================================================
// Unified Chat Interface Types
// =============================================================================

export interface UnifiedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolContext?: {
    toolId: string;
    data?: any;
  };
  timestamp: Date;
  yamlBlocks?: string[];
  ragDocuments?: string[];
  ragEnabled?: boolean;
  toolsUsed?: string[];
  toolResponses?: any[];
  // Interactive UI component to render inside message
  interactiveComponent?: 'pod-selector' | 'yaml-mode-selector' | 'chat-settings';
  interactiveData?: any;
}

export interface ToolDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface OverlayState {
  isOpen: boolean;
  type: 'yaml-editor' | null;
  content: string;
}
