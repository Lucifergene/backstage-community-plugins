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
  VectorStoreProvider,
  VectorStoreDocument,
  VectorStoreQueryResult,
  VectorStoreConfig,
} from './base-vectorstore';

/**
 * ChromaDB vector store implementation
 */
export class ChromaDBVectorStore extends VectorStoreProvider {
  private client: any = null;
  private collection: any = null;

  constructor(config: VectorStoreConfig) {
    super(config);
    if (!config.baseUrl) {
      throw new Error('ChromaDB baseUrl is required');
    }
  }

  async connect(): Promise<void> {
    // Import ChromaDB dynamically
    const { ChromaClient } = await import('chromadb');

    this.client = new ChromaClient({
      path: this.config.baseUrl,
    });

    // Get or create collection
    this.collection = await this.client.getOrCreateCollection({
      name: this.config.indexName,
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) {
        await this.connect();
      }
      const heartbeat = await this.client.heartbeat();
      return heartbeat > 0;
    } catch (error) {
      return false;
    }
  }

  async upsert(documents: VectorStoreDocument[]): Promise<void> {
    if (!this.collection) {
      await this.connect();
    }

    const ids = documents.map(doc => doc.id);
    const embeddings = documents.map(doc => doc.embedding || []);
    const metadatas = documents.map(doc => ({
      content: doc.content,
      ...doc.metadata,
    }));
    const documentsContent = documents.map(doc => doc.content);

    await this.collection.upsert({
      ids,
      embeddings,
      metadatas,
      documents: documentsContent,
    });
  }

  async query(
    embedding: number[],
    topK: number = 5,
    filter?: Record<string, any>,
  ): Promise<VectorStoreQueryResult[]> {
    if (!this.collection) {
      await this.connect();
    }

    const queryRequest: any = {
      queryEmbeddings: [embedding],
      nResults: topK,
    };

    if (filter) {
      queryRequest.where = filter;
    }

    const results = await this.collection.query(queryRequest);

    if (!results.ids || !results.ids[0]) {
      return [];
    }

    return results.ids[0].map((id: string, index: number) => ({
      id,
      score: results.distances?.[0]?.[index] || 0,
      content: results.documents?.[0]?.[index] || '',
      metadata: results.metadatas?.[0]?.[index] || {},
    }));
  }

  async delete(ids: string[]): Promise<void> {
    if (!this.collection) {
      await this.connect();
    }

    await this.collection.delete({
      ids,
    });
  }

  async deleteAll(): Promise<void> {
    if (!this.collection) {
      await this.connect();
    }

    // Delete the collection and recreate it
    await this.client.deleteCollection({ name: this.config.indexName });
    this.collection = await this.client.createCollection({
      name: this.config.indexName,
    });
  }

  async getById(id: string): Promise<VectorStoreDocument | null> {
    if (!this.collection) {
      await this.connect();
    }

    const results = await this.collection.get({
      ids: [id],
      include: ['embeddings', 'metadatas', 'documents'],
    });

    if (!results.ids || results.ids.length === 0) {
      return null;
    }

    return {
      id: results.ids[0],
      content: results.documents?.[0] || '',
      metadata: results.metadatas?.[0] || {},
      embedding: results.embeddings?.[0],
    };
  }

  async getStats(): Promise<{
    totalDocuments: number;
    indexName: string;
    dimensions: number;
  }> {
    if (!this.collection) {
      await this.connect();
    }

    const count = await this.collection.count();

    // Get one document to determine dimensions
    let dimensions = 0;
    const sample = await this.collection.peek({ limit: 1 });
    if (sample.embeddings && sample.embeddings[0]) {
      dimensions = sample.embeddings[0].length;
    }

    return {
      totalDocuments: count,
      indexName: this.config.indexName,
      dimensions,
    };
  }

  async listIds(
    limit: number = 1000,
    _paginationToken?: string,
    _namespace?: string,
  ): Promise<{ ids: string[]; nextToken?: string }> {
    if (!this.collection) {
      await this.connect();
    }

    // ChromaDB doesn't have built-in pagination like Pinecone
    // This is a simplified implementation
    const results = await this.collection.get({
      limit,
      include: [],
    });

    return {
      ids: results.ids || [],
      nextToken: undefined, // ChromaDB pagination would need custom implementation
    };
  }

  async fetchByIds(
    ids: string[],
    _namespace?: string,
  ): Promise<VectorStoreDocument[]> {
    if (!this.collection) {
      await this.connect();
    }

    const results = await this.collection.get({
      ids,
      include: ['embeddings', 'metadatas', 'documents'],
    });

    const documents: VectorStoreDocument[] = [];

    if (results.ids) {
      for (let i = 0; i < results.ids.length; i++) {
        documents.push({
          id: results.ids[i],
          content: results.documents?.[i] || '',
          metadata: (results.metadatas?.[i] as Record<string, any>) || {},
          embedding: results.embeddings?.[i],
        });
      }
    }

    return documents;
  }
}

