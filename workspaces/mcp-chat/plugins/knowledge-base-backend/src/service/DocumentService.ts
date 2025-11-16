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
import { EmbeddingProvider } from '../providers/base-embedding-provider';
import {
  VectorStoreProvider,
  VectorStoreDocument,
} from '../vectorstores/base-vectorstore';
import * as yaml from 'yaml';
import { v4 as uuidv4 } from 'uuid';
import { FileFormat, DocumentInfo } from '../types';

export interface ChunkSettings {
  maxChunkLength: number;
  chunkOverlap: number;
  delimiter: string;
}

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  chunkCount: number;
  uploadedAt: string;
}

/**
 * Service for processing and uploading documents to vector store
 */
export class DocumentService {
  constructor(
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly vectorStore: VectorStoreProvider,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Detect file format from filename
   */
  private detectFormat(fileName: string): FileFormat {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'yaml':
      case 'yml':
        return FileFormat.YAML;
      case 'pdf':
        return FileFormat.PDF;
      case 'txt':
        return FileFormat.TEXT;
      case 'md':
        return FileFormat.MARKDOWN;
      default:
        return FileFormat.TEXT; // fallback
    }
  }

  /**
   * Extract metadata based on file format
   */
  private extractMetadata(
    content: string,
    fileName: string,
    format: FileFormat,
  ): Record<string, any> {
    const metadata: Record<string, any> = {
      fileName,
      format,
      uploadedAt: new Date().toISOString(),
    };

    switch (format) {
      case FileFormat.YAML:
        return this.extractYamlMetadata(content, fileName);
      case FileFormat.PDF:
        return this.extractPdfMetadata(content, fileName);
      case FileFormat.TEXT:
      case FileFormat.MARKDOWN:
        return this.extractTextMetadata(content, fileName);
      default:
        return metadata;
    }
  }

  /**
   * Extract YAML-specific metadata (Kubernetes resources)
   */
  private extractYamlMetadata(
    content: string,
    fileName: string,
  ): Record<string, any> {
    const metadata: Record<string, any> = {
      fileName,
      format: FileFormat.YAML,
      uploadedAt: new Date().toISOString(),
    };

    try {
      const parsed = yaml.parse(content);

      // Extract Kubernetes resource metadata
      if (parsed && typeof parsed === 'object') {
        if (parsed.apiVersion) {
          metadata.apiVersion = parsed.apiVersion;
        }
        if (parsed.kind) {
          metadata.kind = parsed.kind;
        }
        if (parsed.metadata?.name) {
          metadata.resourceName = parsed.metadata.name;
        }
        if (parsed.metadata?.namespace) {
          metadata.namespace = parsed.metadata.namespace;
        }
        if (parsed.metadata?.labels) {
          metadata.labels = JSON.stringify(parsed.metadata.labels);
        }
        if (parsed.metadata?.annotations) {
          metadata.annotations = JSON.stringify(parsed.metadata.annotations);
        }
        if (parsed.spec) {
          // Store important spec fields as searchable metadata
          if (parsed.spec.selector) {
            metadata.selector = JSON.stringify(parsed.spec.selector);
          }
          if (parsed.spec.template?.spec?.containers) {
            const containerNames = parsed.spec.template.spec.containers.map(
              (c: any) => c.name,
            );
            metadata.containers = containerNames.join(',');
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to parse YAML ${fileName}: ${err}`);
    }

    return metadata;
  }

  /**
   * Extract PDF-specific metadata
   */
  private extractPdfMetadata(
    _content: string,
    fileName: string,
  ): Record<string, any> {
    const metadata: Record<string, any> = {
      fileName,
      format: FileFormat.PDF,
      uploadedAt: new Date().toISOString(),
    };

    // Note: PDF parsing would require pdf-parse library
    // For now, just basic metadata
    // TODO: Add pdf-parse integration for extracting title, author, pageCount

    return metadata;
  }

  /**
   * Extract text file metadata
   */
  private extractTextMetadata(
    content: string,
    fileName: string,
  ): Record<string, any> {
    const lineCount = content.split('\n').length;

    return {
      fileName,
      format: fileName.endsWith('.md') ? FileFormat.MARKDOWN : FileFormat.TEXT,
      uploadedAt: new Date().toISOString(),
      lineCount,
    };
  }

  /**
   * Chunk text content based on settings
   */
  private chunkText(text: string, settings: ChunkSettings): string[] {
    const { maxChunkLength, chunkOverlap, delimiter } = settings;
    const chunks: string[] = [];

    if (!delimiter || delimiter === '\n') {
      // Split by lines
      const lines = text.split('\n');
      let currentChunk = '';

      for (const line of lines) {
        if (currentChunk.length + line.length + 1 <= maxChunkLength) {
          currentChunk += (currentChunk ? '\n' : '') + line;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk);
          }
          currentChunk = line;
        }
      }

      if (currentChunk) {
        chunks.push(currentChunk);
      }
    } else {
      // Split by custom delimiter
      const parts = text.split(delimiter);
      let currentChunk = '';

      for (const part of parts) {
        const pieceWithDelimiter = part + delimiter;
        if (currentChunk.length + pieceWithDelimiter.length <= maxChunkLength) {
          currentChunk += pieceWithDelimiter;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk.trimEnd());
          }
          currentChunk = pieceWithDelimiter;
        }
      }

      if (currentChunk) {
        chunks.push(currentChunk.trimEnd());
      }
    }

    // Apply overlap
    if (chunkOverlap > 0 && chunks.length > 1) {
      const overlappedChunks: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        let chunk = chunks[i];

        // Add overlap from previous chunk
        if (i > 0) {
          const prevChunk = chunks[i - 1];
          const overlapText = prevChunk.slice(-chunkOverlap);
          chunk = overlapText + chunk;
        }

        overlappedChunks.push(chunk);
      }
      return overlappedChunks;
    }

    return chunks;
  }

  /**
   * Process and upload a file (supports multiple formats)
   */
  async uploadFile(
    fileContent: string,
    fileName: string,
    chunkSettings: ChunkSettings,
  ): Promise<UploadedDocument> {
    const format = this.detectFormat(fileName);
    this.logger.info(`Processing ${format} file: ${fileName}`);

    try {
      // Extract metadata based on format
      const baseMetadata = this.extractMetadata(fileContent, fileName, format);
      this.logger.info(`Extracted metadata: ${JSON.stringify(baseMetadata)}`);

      // Chunk the content
      const chunks = this.chunkText(fileContent, chunkSettings);
      this.logger.info(`Created ${chunks.length} chunks from ${fileName}`);

      // Generate embeddings for all chunks
      this.logger.info(`Generating embeddings for ${chunks.length} chunks...`);
      const embeddings = await this.embeddingProvider.generateBatchEmbeddings(
        chunks,
      );

      // Prepare documents for vector store
      const documents: VectorStoreDocument[] = chunks.map((chunk, index) => ({
        id: `${fileName}-${uuidv4()}`,
        content: chunk,
        embedding: embeddings[index],
        metadata: {
          ...baseMetadata,
          chunkIndex: index,
          totalChunks: chunks.length,
        },
      }));

      // Upsert to vector store
      this.logger.info(
        `Upserting ${documents.length} documents to vector store...`,
      );
      await this.vectorStore.upsert(documents);

      this.logger.info(
        `Successfully uploaded ${fileName} with ${chunks.length} chunks`,
      );

      return {
        id: uuidv4(),
        fileName,
        fileSize: fileContent.length,
        chunkCount: chunks.length,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload file ${fileName}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }

  /**
   * Upload multiple files (supports multiple formats)
   */
  async uploadFiles(
    files: Array<{ content: string; fileName: string }>,
    chunkSettings: ChunkSettings,
  ): Promise<UploadedDocument[]> {
    this.logger.info(`Uploading ${files.length} files...`);

    const results: UploadedDocument[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile(
          file.content,
          file.fileName,
          chunkSettings,
        );
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Failed to upload ${file.fileName}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
        // Continue with other files
      }
    }

    this.logger.info(
      `Successfully uploaded ${results.length}/${files.length} files`,
    );
    return results;
  }

  /**
   * List all uploaded documents grouped by fileName
   */
  async listDocuments(namespace?: string): Promise<DocumentInfo[]> {
    this.logger.info('Listing all uploaded documents...');

    const documentMap = new Map<string, DocumentInfo>();

    try {
      // Fetch all vector IDs with pagination
      let hasMore = true;
      let paginationToken: string | undefined;
      let totalVectorsFetched = 0;

      while (hasMore) {
        // List vector IDs (100 at a time - Pinecone limit)
        const { ids, nextToken } = await this.vectorStore.listIds(
          100,
          paginationToken,
          namespace,
        );

        if (ids.length === 0) {
          break;
        }

        totalVectorsFetched += ids.length;
        this.logger.info(
          `Fetched ${ids.length} vector IDs (total: ${totalVectorsFetched})`,
        );

        // Fetch metadata for these IDs (in batches of 100 to avoid limits)
        const batchSize = 100;
        for (let i = 0; i < ids.length; i += batchSize) {
          const batchIds = ids.slice(i, i + batchSize);
          const documents = await this.vectorStore.fetchByIds(
            batchIds,
            namespace,
          );

          // Group by fileName
          for (const doc of documents) {
            const fileName = doc.metadata.fileName;
            if (!fileName) continue;

            if (documentMap.has(fileName)) {
              const existing = documentMap.get(fileName)!;
              existing.chunkCount++;
              existing.totalSize += doc.content.length;
            } else {
              documentMap.set(fileName, {
                fileName,
                format: doc.metadata.format || FileFormat.TEXT,
                kind: doc.metadata.kind,
                apiVersion: doc.metadata.apiVersion,
                namespace: doc.metadata.namespace,
                chunkCount: 1,
                uploadedAt: doc.metadata.uploadedAt || new Date().toISOString(),
                totalSize: doc.content.length,
                pageCount: doc.metadata.pageCount,
                author: doc.metadata.author,
                lineCount: doc.metadata.lineCount,
              });
            }
          }
        }

        // Check for more pages
        paginationToken = nextToken;
        hasMore = !!nextToken;
      }

      const documents = Array.from(documentMap.values());
      this.logger.info(`Found ${documents.length} unique documents`);
      return documents;
    } catch (error) {
      this.logger.error(
        `Failed to list documents: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }

  /**
   * Delete a document by fileName (deletes all chunks)
   */
  async deleteDocument(
    fileName: string,
    namespace?: string,
  ): Promise<{ deletedCount: number }> {
    this.logger.info(`Deleting document: ${fileName}`);

    try {
      const idsToDelete: string[] = [];

      // Fetch all vector IDs and find matching documents
      let hasMore = true;
      let paginationToken: string | undefined;

      while (hasMore) {
        const { ids, nextToken } = await this.vectorStore.listIds(
          100,
          paginationToken,
          namespace,
        );

        if (ids.length === 0) {
          break;
        }

        // Fetch documents in batches
        const batchSize = 100;
        for (let i = 0; i < ids.length; i += batchSize) {
          const batchIds = ids.slice(i, i + batchSize);
          const documents = await this.vectorStore.fetchByIds(
            batchIds,
            namespace,
          );

          // Filter by fileName and collect IDs
          for (const doc of documents) {
            if (doc.metadata.fileName === fileName) {
              idsToDelete.push(doc.id);
            }
          }
        }

        paginationToken = nextToken;
        hasMore = !!nextToken;
      }

      if (idsToDelete.length === 0) {
        this.logger.warn(`No chunks found for document: ${fileName}`);
        return { deletedCount: 0 };
      }

      // Delete all matching chunks
      await this.vectorStore.delete(idsToDelete);

      this.logger.info(
        `Successfully deleted ${idsToDelete.length} chunks for document: ${fileName}`,
      );

      return { deletedCount: idsToDelete.length };
    } catch (error) {
      this.logger.error(
        `Failed to delete document ${fileName}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error;
    }
  }
}

