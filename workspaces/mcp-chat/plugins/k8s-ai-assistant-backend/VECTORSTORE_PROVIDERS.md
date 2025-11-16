# Vector Store Providers

The K8s AI Assistant backend supports multiple vector store providers through an extensible provider pattern, similar to the LLM provider system.

## Architecture

```
VectorStoreProvider (Abstract Base Class)
├── PineconeVectorStore
├── ChromaDBVectorStore
└── [Future: QdrantVectorStore, WeaviateVectorStore, etc.]
```

## Supported Providers

### 1. Pinecone

**Configuration:**

```yaml
k8sAiAssistant:
  vectorStore:
    id: pinecone
    apiKey: ${PINECONE_API_KEY}
    indexName: k8s-knowledge-base
    environment: us-east-1  # Optional
```

**Features:**

- ✅ Fully managed cloud vector database
- ✅ High performance and scalability
- ✅ Built-in metadata filtering
- ✅ Serverless or pod-based deployments

**Setup:**

1. Create account at [pinecone.io](https://pinecone.io)
2. Create an index with matching dimensions (e.g., 3072 for gemini-embedding-001)
3. Get API key from Pinecone console
4. Set `PINECONE_API_KEY` environment variable

### 2. ChromaDB

**Configuration:**

```yaml
k8sAiAssistant:
  vectorStore:
    id: chromadb
    baseUrl: http://localhost:8000
    indexName: k8s-knowledge-base
```

**Features:**

- ✅ Open-source embedding database
- ✅ Self-hosted option
- ✅ Easy local development
- ✅ Python and JavaScript clients

**Setup (Docker):**

```bash
docker run -d -p 8000:8000 chromadb/chroma:latest
```

**Setup (Python):**

```bash
pip install chromadb
chroma run --host localhost --port 8000
```

## Provider Interface

All vector store providers implement the following interface:

### Core Methods

#### `connect(): Promise<void>`

Initialize connection to the vector store.

#### `healthCheck(): Promise<boolean>`

Check if the connection is healthy.

#### `upsert(documents: VectorStoreDocument[]): Promise<void>`

Insert or update documents in the vector store.

```typescript
interface VectorStoreDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}
```

#### `query(embedding: number[], topK: number, filter?: Record<string, any>): Promise<VectorStoreQueryResult[]>`

Query the vector store with an embedding vector.

```typescript
interface VectorStoreQueryResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
}
```

#### `delete(ids: string[]): Promise<void>`

Delete documents by their IDs.

#### `deleteAll(): Promise<void>`

Delete all documents (use with caution).

#### `getById(id: string): Promise<VectorStoreDocument | null>`

Retrieve a specific document by ID.

#### `getStats(): Promise<StatsResponse>`

Get statistics about the index.

```typescript
interface StatsResponse {
  totalDocuments: number;
  indexName: string;
  dimensions: number;
}
```

## Usage Example

```typescript
import { VectorStoreFactory } from './vectorstores/vectorstore-factory';
import { RootConfigService } from '@backstage/backend-plugin-api';

// Create from config
const vectorStore = VectorStoreFactory.createFromConfig(config);

if (vectorStore) {
  // Connect to the vector store
  await vectorStore.connect();

  // Check health
  const isHealthy = await vectorStore.healthCheck();
  
  // Upsert documents
  await vectorStore.upsert([
    {
      id: 'doc-1',
      content: 'Kubernetes deployment configuration...',
      metadata: { type: 'deployment', namespace: 'default' },
      embedding: [0.1, 0.2, 0.3, ...], // 3072 dimensions for gemini
    },
  ]);

  // Query similar documents
  const results = await vectorStore.query(
    queryEmbedding,  // Your query vector
    5,               // Top 5 results
    { type: 'deployment' }  // Optional filter
  );

  // Get statistics
  const stats = await vectorStore.getStats();
  console.log(`Total documents: ${stats.totalDocuments}`);
}
```

## Adding New Providers

To add a new vector store provider:

1. **Create Provider Class**

   ```typescript
   // src/vectorstores/qdrant-vectorstore.ts
   import { VectorStoreProvider } from './base-vectorstore';
   
   export class QdrantVectorStore extends VectorStoreProvider {
     // Implement all abstract methods
   }
   ```

2. **Add to Factory**

   ```typescript
   // src/vectorstores/vectorstore-factory.ts
   case 'qdrant':
     return new QdrantVectorStore(config);
   ```

3. **Add Dependencies**

   ```bash
   yarn add @qdrant/js-client
   ```

4. **Update Documentation**
   Add configuration examples and setup instructions here.

## Configuration Options

### Common Options (All Providers)

- `id` (required): Provider identifier (e.g., "pinecone", "chromadb")
- `indexName` (required): Name of the index/collection
- `apiKey` (optional): API key for cloud providers
- `baseUrl` (optional): Base URL for self-hosted instances
- `environment` (optional): Environment identifier (e.g., Pinecone environment)
- `config` (optional): Additional provider-specific configuration

### Provider-Specific Options

#### Pinecone

- `environment`: Pinecone environment (e.g., "us-east-1")
- Usually requires `apiKey`

#### ChromaDB

- `baseUrl`: Required for self-hosted instances
- No `apiKey` needed for local instances

## Environment Variables

```bash
# Pinecone
export PINECONE_API_KEY="your-api-key"

# Qdrant (future)
export QDRANT_API_KEY="your-api-key"
```

## Testing

Each provider should be testable independently:

```typescript
import { PineconeVectorStore } from './pinecone-vectorstore';

const vectorStore = new PineconeVectorStore({
  id: 'pinecone',
  apiKey: process.env.PINECONE_API_KEY!,
  indexName: 'test-index',
});

await vectorStore.connect();
const isHealthy = await vectorStore.healthCheck();
expect(isHealthy).toBe(true);
```

## Best Practices

1. **Always check health** before operations
2. **Handle connection errors** gracefully
3. **Use metadata** for filtering and organization
4. **Batch operations** when possible (upsert multiple documents)
5. **Match embedding dimensions** with your embedding model
6. **Use appropriate indexName** for different use cases
7. **Clean up** unused documents regularly

## Future Providers

Planned support for:

- **Qdrant**: High-performance vector search engine
- **Weaviate**: Open-source vector database with schema
- **Milvus**: Cloud-native vector database
- **Redis**: With vector similarity search
- **Elasticsearch**: With dense vector support

## Troubleshooting

### Connection Issues

**Pinecone:**

- Verify API key is correct
- Check index exists in your account
- Ensure dimensions match your embedding model

**ChromaDB:**

- Verify ChromaDB server is running
- Check `baseUrl` is accessible
- Ensure port is not blocked by firewall

### Performance Tips

1. **Batch inserts**: Use arrays instead of single documents
2. **Use filters**: Reduce search space with metadata filters
3. **Optimize dimensions**: Balance between accuracy and performance
4. **Monitor stats**: Check `getStats()` regularly for index health

## Resources

- [Pinecone Documentation](https://docs.pinecone.io/)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Vector Store Selection Guide](https://www.pinecone.io/learn/vector-database/)
