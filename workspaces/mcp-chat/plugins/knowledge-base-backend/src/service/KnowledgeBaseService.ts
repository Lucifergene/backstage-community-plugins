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
  DocumentInfo,
  SearchOptions,
  SearchResult,
  KnowledgeBaseStatus,
} from '../types';
import { ChunkSettings, UploadedDocument } from './DocumentService';

/**
 * Interface for Knowledge Base service that manages RAG operations
 */
export interface KnowledgeBaseService {
  /**
   * Upload documents to the knowledge base
   */
  uploadDocuments(
    files: Array<{ content: string; fileName: string }>,
    settings: ChunkSettings,
  ): Promise<UploadedDocument[]>;

  /**
   * List all documents in the knowledge base
   */
  listDocuments(namespace?: string): Promise<DocumentInfo[]>;

  /**
   * Delete a document by fileName
   */
  deleteDocument(
    fileName: string,
    namespace?: string,
  ): Promise<{ deletedCount: number }>;

  /**
   * Search the knowledge base with a text query
   */
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  /**
   * Get status of the knowledge base (embedding provider and vector store)
   */
  getStatus(): Promise<KnowledgeBaseStatus>;
}

