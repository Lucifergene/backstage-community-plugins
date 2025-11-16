# Knowledge Base Backend Plugin

A reusable Backstage backend plugin that provides RAG (Retrieval-Augmented Generation) capabilities including embedding providers and vector stores for knowledge retrieval.

## Features

- **Embedding Providers**: Support for OpenAI and Gemini embedding models
- **Vector Stores**: Support for Pinecone and ChromaDB
- **Document Management**: Upload, search, list, and delete documents
- **Flexible Configuration**: Array-based configuration for easy provider switching
- **Service-Based API**: Clean integration pattern for other plugins

## Installation

This plugin is designed to be used as a dependency by other Backstage plugins.

```bash
# In your plugin's package.json
{
  "dependencies": {
    "@internal/backstage-plugin-knowledge-base-backend": "workspace:^"
  }
}
```

## Configuration

Add the following to your `app-config.yaml`:

```yaml
knowledgeBase:
  # Embedding providers (first in array is active)
  embeddingProviders:
    - id: gemini
      token: ${GEMINI_API_KEY}
      model: gemini-embedding-001
      dimensions: 3072
    - id: openai
      token: ${OPENAI_API_KEY}
      model: text-embedding-3-small
      dimensions: 1536
  
  # Vector stores (first in array is active)
  vectorStores:
    - id: pinecone
      apiKey: ${PINECONE_API_KEY}
      indexName: knowledge-base
    - id: chromadb
      baseUrl: http://localhost:8000
      indexName: knowledge-base
```

## Usage

### In Your Plugin

```typescript
import { getKnowledgeBaseService } from '@internal/backstage-plugin-knowledge-base-backend';

export const yourPlugin = createBackendPlugin({
  pluginId: 'your-plugin',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ logger, config }) {
        // Get knowledge base service
        const kbService = await getKnowledgeBaseService({ logger, config });
        
        // Upload documents
        await kbService.uploadDocuments([
          {
            fileName: 'example.yaml',
            content: 'apiVersion: v1\nkind: Pod\n...'
          }
        ], {
          maxChunkLength: 1000,
          chunkOverlap: 200,
          delimiter: '\n'
        });
        
        // Search knowledge base
        const results = await kbService.search('kubernetes deployment', {
          topK: 3,
          filter: { format: 'yaml' }
        });
        
        // List documents
        const docs = await kbService.listDocuments();
        
        // Delete document
        await kbService.deleteDocument('example.yaml');
        
        // Get status
        const status = await kbService.getStatus();
      }
    });
  }
});
```

## Supported Providers

### Embedding Providers

| Provider | Models | Dimensions |
|----------|--------|------------|
| **Gemini** | `gemini-embedding-001`, `text-embedding-004` | 768-3072 |
| **OpenAI** | `text-embedding-3-small`, `text-embedding-3-large`, `text-embedding-ada-002` | 1536-3072 |

### Vector Stores

| Provider | Type | Notes |
|----------|------|-------|
| **Pinecone** | Managed | Requires API key and index creation |
| **ChromaDB** | Self-hosted | Requires running ChromaDB instance |

## API Reference

### KnowledgeBaseService

```typescript
interface KnowledgeBaseService {
  uploadDocuments(files, settings): Promise<UploadedDocument[]>
  listDocuments(namespace?): Promise<DocumentInfo[]>
  deleteDocument(fileName, namespace?): Promise<{deletedCount: number}>
  search(query, options?): Promise<SearchResult[]>
  getStatus(): Promise<KnowledgeBaseStatus>
}
```

## Migration from k8s-ai-assistant-backend

If you're migrating from the old embedded RAG implementation:

1. Update `package.json`:
```json
{
  "dependencies": {
    "@internal/backstage-plugin-knowledge-base-backend": "workspace:^"
  }
}
```

2. Update configuration namespace from `k8sAiAssistant` to `knowledgeBase`

3. Replace imports:
```typescript
// Before
import { DocumentService } from '../services/DocumentService';
import { EmbeddingProvider } from '../providers/base-embedding-provider';

// After
import { KnowledgeBaseService, getKnowledgeBaseService } from '@internal/backstage-plugin-knowledge-base-backend';
```

4. Update service initialization:
```typescript
// Before
const documentService = new DocumentService(embeddingProvider, vectorStore, logger);

// After
const knowledgeBaseService = await getKnowledgeBaseService({ logger, config });
```

## Future Plans

- Support for additional embedding providers (Cohere, HuggingFace)
- Support for additional vector stores (Qdrant, Weaviate)
- Advanced chunking strategies
- Metadata filtering improvements
- Multi-namespace support

## License

Apache-2.0

