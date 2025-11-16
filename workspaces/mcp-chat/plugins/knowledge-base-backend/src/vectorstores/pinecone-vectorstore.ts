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
 * Pinecone vector store implementation
 */
export class PineconeVectorStore extends VectorStoreProvider {
  private client: any = null;
  private index: any = null;

  constructor(config: VectorStoreConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Pinecone API key is required');
    }

    // Import Pinecone dynamically to avoid requiring it if not used
    const { Pinecone } = await import('@pinecone-database/pinecone');

    this.client = new Pinecone({
      apiKey: this.config.apiKey,
    });

    this.index = this.client.index(this.config.indexName);
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.index) {
        await this.connect();
      }
      // Try to describe the index
      const stats = await this.index.describeIndexStats();
      return !!stats;
    } catch (error) {
      return false;
    }
  }

  async upsert(documents: VectorStoreDocument[]): Promise<void> {
    if (!this.index) {
      await this.connect();
    }

    const vectors = documents.map(doc => ({
      id: doc.id,
      values: doc.embedding || [],
      metadata: {
        content: doc.content,
        ...doc.metadata,
      },
    }));

    await this.index.upsert(vectors);
  }

  async query(
    embedding: number[],
    topK: number = 5,
    filter?: Record<string, any>,
  ): Promise<VectorStoreQueryResult[]> {
    if (!this.index) {
      await this.connect();
    }

    const queryRequest: any = {
      vector: embedding,
      topK,
      includeMetadata: true,
    };

    if (filter) {
      queryRequest.filter = filter;
    }

    const results = await this.index.query(queryRequest);

    return (
      results.matches?.map((match: any) => ({
        id: match.id,
        score: match.score,
        content: match.metadata?.content || '',
        metadata: match.metadata || {},
      })) || []
    );
  }

  async delete(ids: string[]): Promise<void> {
    if (!this.index) {
      await this.connect();
    }

    await this.index.deleteMany(ids);
  }

  async deleteAll(): Promise<void> {
    if (!this.index) {
      await this.connect();
    }

    await this.index.deleteAll();
  }

  async getById(id: string): Promise<VectorStoreDocument | null> {
    if (!this.index) {
      await this.connect();
    }

    const result = await this.index.fetch([id]);

    if (!result.records || !result.records[id]) {
      return null;
    }

    const record = result.records[id];
    return {
      id: record.id,
      content: record.metadata?.content || '',
      metadata: record.metadata || {},
      embedding: record.values,
    };
  }

  async getStats(): Promise<{
    totalDocuments: number;
    indexName: string;
    dimensions: number;
  }> {
    if (!this.index) {
      await this.connect();
    }

    const stats = await this.index.describeIndexStats();

    return {
      totalDocuments: stats.totalRecordCount || 0,
      indexName: this.config.indexName,
      dimensions: stats.dimension || 0,
    };
  }

  async listIds(
    limit: number = 100,
    paginationToken?: string,
    _namespace?: string,
  ): Promise<{ ids: string[]; nextToken?: string }> {
    if (!this.index) {
      await this.connect();
    }

    // Pinecone limit must be between 1-100
    const actualLimit = Math.min(Math.max(limit, 1), 100);

    const params: any = { limit: actualLimit };
    if (paginationToken) {
      params.paginationToken = paginationToken;
    }
    // Note: Pinecone's listPaginated doesn't support namespace parameter
    // It only supports prefix filtering

    const result = await this.index.listPaginated(params);

    return {
      ids: result.vectors?.map((v: any) => v.id) || [],
      nextToken: result.pagination?.next,
    };
  }

  async fetchByIds(
    ids: string[],
    namespace?: string,
  ): Promise<VectorStoreDocument[]> {
    if (!this.index) {
      await this.connect();
    }

    const params: any = {};
    if (namespace) {
      params.namespace = namespace;
    }

    const result = await this.index.fetch(ids, params);

    const documents: VectorStoreDocument[] = [];

    if (result.records) {
      for (const [id, record] of Object.entries(result.records)) {
        documents.push({
          id,
          content: (record as any).metadata?.content || '',
          metadata: (record as any).metadata || {},
          embedding: (record as any).values,
        });
      }
    }

    return documents;
  }
}

