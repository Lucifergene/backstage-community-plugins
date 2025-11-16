# Kubernetes AI Assistant for Backstage

Welcome to the Kubernetes AI Assistant plugin for Backstage! This comprehensive plugin suite provides AI-powered assistance for Kubernetes operations, YAML generation, log analysis, and intelligent chat capabilities with support for MCP (Model Context Protocol) servers and RAG (Retrieval-Augmented Generation).

[![Backstage](https://img.shields.io/badge/Backstage-Plugin-blue.svg)](https://backstage.io)

## Overview

The Kubernetes AI Assistant brings advanced AI capabilities directly into your Backstage environment for Kubernetes operations. It combines the power of LLMs with MCP servers for tool execution and RAG for context-aware responses, enabling developers to interact with their Kubernetes infrastructure through natural language.

## Features

- 🤖 **Multi-Provider AI Support**: Works with OpenAI, Claude, Gemini, and Ollama
- 🚀 **Kubernetes Log Analysis**: Intelligent analysis of pod logs with MCP tool integration
- 📝 **YAML Manifest Generation**: AI-powered generation of Kubernetes manifests with RAG-enhanced examples
- 💬 **General Chat Interface**: Flexible chat system with MCP tools and RAG support
- 🔧 **MCP Server Integration**: Connect to multiple MCP servers (Kubernetes, Brave Search, Backstage, etc.)
- 📚 **Knowledge Base (RAG)**: Upload and query documentation with vector search capabilities
- 🛠️ **Unified Chat Experience**: Tab-based interface for different AI assistance modes
- ⚡ **Real-time Status Monitoring**: Track AI provider, vector store, and MCP server health

## Supported AI Providers

The following AI providers have been thoroughly tested:

| Provider   | Model              | Status          | Notes                                                  |
| ---------- | ------------------ | --------------- | ------------------------------------------------------ |
| **OpenAI** | `gpt-4o-mini`      | ✅ Fully Tested | Recommended for production use                         |
| **Gemini** | `gemini-2.5-flash` | ✅ Fully Tested | Excellent performance with tool calling                |
| **Ollama** | `llama3.1:8b`      | ✅ Tested       | Works well locally, use larger models for better tools |

> **Note**: While other providers and models may work, they have not been extensively tested. The plugin supports any provider that implements tool calling functionality.

## Quick Start with Gemini (Free)

To quickly test this plugin, we recommend using Gemini's free API:

1. **Visit Google AI Studio**: Go to <https://aistudio.google.com>
2. **Sign in**: Use your Google account to sign in
3. **Create API Key**:
   - Click on "**Get API key**" in the left sidebar
   - Click "**Create API key in new project**" (or select an existing project)
   - **Copy** the generated API key
4. **Set Environment Variable**:

   ```bash
   export GEMINI_API_KEY="your-api-key-here"
   ```

> **💡 Tip**: Gemini offers a generous **free tier** that's perfect for testing and development.

## Screenshots

<div align="center">

### Main Chat Interface
<!-- TODO: Add screenshot of main chat interface -->
![Main Chat Interface](../../docs/images/k8s-chat-interface.png)
*The unified chat interface with multiple AI assistance modes*

### Log Analysis
<!-- TODO: Add screenshot of log analysis -->
![Log Analysis](../../docs/images/k8s-log-analysis.png)
*Intelligent pod log analysis with MCP tool integration*

### YAML Generation
<!-- TODO: Add screenshot of YAML generation -->
![YAML Generation](../../docs/images/k8s-yaml-generator.png)
*AI-powered YAML manifest generation with RAG examples*

### Knowledge Base Management
<!-- TODO: Add screenshot of knowledge base -->
![Knowledge Base](../../docs/images/k8s-knowledge-base.png)
*Upload and manage documentation for RAG-enhanced responses*

### Status Dashboard
<!-- TODO: Add screenshot of status panel -->
![Status Dashboard](../../docs/images/k8s-status-dashboard.png)
*Real-time monitoring of AI providers, MCP servers, and vector stores*

</div>

## Architecture

The Kubernetes AI Assistant consists of three integrated plugins:

1. **`@backstage-community/plugin-k8s-ai-assistant`** - Frontend plugin providing the UI
2. **`@backstage-community/plugin-k8s-ai-assistant-backend`** - Backend plugin handling AI operations
3. **`@backstage-community/plugin-knowledge-base-backend`** - Shared RAG service for vector search

## Prerequisites

- Backstage v1.20+ (for new backend system support)
- Node.js 18+
- One or more AI provider API keys (OpenAI, Gemini, etc.)
- (Optional) Pinecone or ChromaDB for RAG features
- (Optional) MCP server dependencies (Kubernetes MCP, Brave Search, etc.)

## Installation

This plugin suite consists of three packages that work together:

- `@backstage-community/plugin-k8s-ai-assistant` - Frontend plugin
- `@backstage-community/plugin-k8s-ai-assistant-backend` - Backend plugin
- `@backstage-community/plugin-knowledge-base-backend` - RAG backend plugin

### Backend Installation

1. **Install the backend plugins**:

   ```bash
   # From your Backstage root directory
   yarn --cwd packages/backend add @backstage-community/plugin-k8s-ai-assistant-backend
   yarn --cwd packages/backend add @backstage-community/plugin-knowledge-base-backend
   ```

2. **Add to your backend**:

   ```ts
   // In packages/backend/src/index.ts
   const backend = createBackend();
   // ... other plugins
   backend.add(import('@backstage-community/plugin-k8s-ai-assistant-backend'));
   // Note: knowledge-base-backend is automatically initialized by k8s-ai-assistant-backend
   ```

### Frontend Installation

1. **Install the frontend plugin**:

   ```bash
   # From your Backstage root directory
   yarn --cwd packages/app add @backstage-community/plugin-k8s-ai-assistant
   ```

2. **Add to your app**:

   **For the classic frontend system:**

   ```tsx
   // In packages/app/src/App.tsx
   import { K8SAiAssistantPage } from '@backstage-community/plugin-k8s-ai-assistant';

   // Add to your routes
   <Route path="/k8s-ai-assistant" element={<K8SAiAssistantPage />} />;
   ```

3. **Add navigation**:

   ```tsx
   // In packages/app/src/components/Root/Root.tsx
   import ChatIcon from '@material-ui/icons/Chat';

   // In your sidebar items
   <SidebarItem icon={ChatIcon} to="k8s-ai-assistant" text="K8s AI Assistant" />;
   ```

## Configuration

Add the following configuration to your `app-config.yaml`:

```yaml
# Shared MCP Chat configuration (used by k8s-ai-assistant and other MCP plugins)
mcpChat:
  # LLM Provider configuration
  providers:
    - id: gemini
      token: ${GEMINI_API_KEY}
      model: gemini-2.5-flash
    - id: openai
      token: ${OPENAI_API_KEY}
      model: gpt-4o-mini
    - id: ollama
      baseUrl: 'http://localhost:11434'
      model: llama3.1:8b

  # MCP Servers configuration
  mcpServers:
    # Kubernetes server for K8s operations
    - id: kubernetes-server
      name: Kubernetes MCP Server
      type: stdio
      npxCommand: kubernetes-mcp-server@latest
      env:
        KUBECONFIG: ${KUBECONFIG}

    # Brave Search for web searching
    - id: brave-search-server
      name: Brave Search Server
      type: stdio
      npxCommand: '@modelcontextprotocol/server-brave-search@latest'
      env:
        BRAVE_API_KEY: ${BRAVE_API_KEY}

    # Backstage server integration
    - id: backstage-server
      name: Backstage Server
      type: streamable-http
      url: 'http://localhost:7007/api/mcp-actions/v1'
      headers:
        Authorization: 'Bearer ${BACKSTAGE_MCP_TOKEN}'

# Knowledge Base configuration (RAG service)
knowledgeBase:
  # Embedding Providers (for vector search)
  embeddingProviders:
    - id: gemini
      token: ${GEMINI_API_KEY}
      model: gemini-embedding-001
      dimensions: 3072
    - id: openai
      token: ${OPENAI_API_KEY}
      model: text-embedding-3-small
      dimensions: 1536

  # Vector Store configuration
  vectorStores:
    - id: pinecone
      apiKey: ${PINECONE_API_KEY}
      indexName: k8s-knowledge-base
    - id: chromadb
      baseUrl: http://localhost:8000
      indexName: k8s-knowledge-base
```

For more advanced MCP server configuration examples, see the [MCP Chat plugin documentation](../mcp-chat/README.md#configuration).

### Environment Variables

Set the following environment variables in your Backstage deployment:

```bash
# AI Provider API Keys (choose one or more)
export GEMINI_API_KEY="your-gemini-api-key"
export OPENAI_API_KEY="sk-your-openai-key"

# MCP Server Configuration (optional)
export BRAVE_API_KEY="your-brave-api-key"
export BACKSTAGE_MCP_TOKEN="your-backstage-token"
export KUBECONFIG="/path/to/your/kubeconfig.yaml"

# RAG Configuration (optional, for Knowledge Base features)
export PINECONE_API_KEY="your-pinecone-api-key"
# OR for ChromaDB (local installation)
# No API key needed, just ensure ChromaDB is running on http://localhost:8000
```

## Usage

### 1. Navigate to the Plugin

Go to the **K8s AI Assistant** page in your Backstage instance (`/k8s-ai-assistant`)

### 2. Access the Unified Interface

The plugin provides four main modes accessible via tabs:

#### **Log Analysis Tab**

- Select a Kubernetes pod from your cluster
- Choose log type (stdout/stderr/both)
- AI analyzes logs using MCP Kubernetes tools
- Get intelligent insights and troubleshooting recommendations

#### **YAML Generator Tab**

- Describe the Kubernetes resource you need
- Enable RAG to use uploaded YAML examples as templates
- AI generates properly formatted manifests
- Edit, copy, or save generated YAML

#### **General Chat Tab**

- Ask any Kubernetes-related question
- Toggle MCP tools for live cluster queries
- Toggle RAG for documentation-based answers
- Combine both for comprehensive assistance

#### **Knowledge Base Tab**

- Upload YAML manifests, PDFs, or text documentation
- View and manage uploaded documents
- Delete documents when no longer needed
- Documents are automatically used by RAG-enabled features

### 3. Monitor System Status

Expand the status panel on the right to view:

- **AI Provider Status**: Connection and model information
- **MCP Server Status**: Available tools and server health
- **Vector Store Status**: RAG configuration and document count

### Example Queries

| Query                                                                          | Mode         | Features Used    | Purpose                        |
| ------------------------------------------------------------------------------ | ------------ | ---------------- | ------------------------------ |
| "Analyze the logs of pod my-app-xyz in namespace production"                  | Log Analysis | MCP Tools        | Debug application issues       |
| "Generate a deployment YAML for nginx with 3 replicas"                        | YAML Gen     | RAG (optional)   | Create manifests quickly       |
| "Show me all pods in the default namespace that are not running"              | General Chat | MCP Tools        | Query live cluster state       |
| "What are the best practices for resource limits?"                            | General Chat | RAG              | Get documentation answers      |
| "Check the health of my ingress controller and suggest improvements"          | General Chat | MCP + RAG        | Comprehensive cluster analysis |

## Features in Detail

### 🚀 Log Analysis with MCP Integration

The log analysis feature automatically:

1. Fetches logs from Kubernetes using MCP tools
2. Analyzes error patterns and warnings
3. Provides actionable troubleshooting steps
4. Supports multi-turn conversations for follow-up questions

### 📝 YAML Generation with RAG

Generate Kubernetes manifests intelligently:

1. Describe your requirements in natural language
2. Enable RAG to reference uploaded YAML examples
3. AI generates manifests following your organization's patterns
4. Edit in built-in Monaco editor
5. Copy or download generated YAML

### 💬 General Chat with MCP + RAG

The most flexible mode combining:

- **MCP Tools**: Execute live queries against Kubernetes clusters
- **RAG**: Reference uploaded documentation for accurate answers
- **Conversation History**: Multi-turn dialogue with context retention
- **Tool Transparency**: See which tools were called and their responses

### 📚 Knowledge Base Management

Upload and manage documentation:

- **Supported Formats**: YAML, PDF, TXT, Markdown
- **Automatic Processing**: Documents are chunked and vectorized
- **Metadata Extraction**: YAML files extract kind, apiVersion, etc.
- **Search**: Find documents by content similarity
- **Management**: View, filter, and delete documents

## Development

### Local Development Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/backstage/community-plugins.git
   cd workspaces/mcp-chat
   ```

2. **Install dependencies**:

   ```bash
   yarn install
   ```

3. **Start the development server**:

   ```bash
   yarn start
   ```

4. **Access the plugin**: Navigate to <http://localhost:3000/k8s-ai-assistant>

### Testing

Run the test suite:

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run backend tests
yarn --cwd plugins/k8s-ai-assistant-backend test

# Run frontend tests
yarn --cwd plugins/k8s-ai-assistant test
```

### Building

Build all packages:

```bash
yarn build:all
```

## Troubleshooting

### Common Issues

#### AI Provider Shows as Disconnected

- **Cause**: Missing or invalid API keys
- **Solution**:
  - Verify API keys are set as environment variables
  - Check provider configuration in `app-config.yaml`
  - Ensure the specified model is available for your API key
  - Check backend logs for connection errors

#### MCP Tools Are Not Being Called

- **Cause**: MCP servers not properly configured or AI model limitations
- **Solution**:
  - Verify MCP server configuration in `app-config.yaml`
  - Check MCP server status in the UI status panel
  - For Ollama, use larger models like `llama3.1:30b` for better tool calling
  - Check backend logs for MCP connection errors
  - Ensure required environment variables (e.g., `KUBECONFIG`) are set

#### Vector Store Connection Failed

- **Cause**: Missing RAG configuration or invalid credentials
- **Solution**:
  - Verify embedding provider and vector store configuration
  - For Pinecone: Check API key and ensure index exists
  - For ChromaDB: Ensure ChromaDB is running on the configured URL
  - Check backend logs for specific error messages
  - RAG features are optional - the plugin works without them

#### Knowledge Base Upload Fails

- **Cause**: Vector store not configured or connection issues
- **Solution**:
  - Ensure `knowledgeBase` section is configured in `app-config.yaml`
  - Verify embedding provider credentials
  - Check vector store connection status in UI
  - Ensure documents are in supported formats (YAML, PDF, TXT, MD)

### Debug Endpoints

Use these endpoints for debugging:

- **Health Check**: `/api/k8s-ai-assistant/health`
- **Provider Status**: `/api/k8s-ai-assistant/provider/status`
- **Vector Store Status**: `/api/k8s-ai-assistant/vectorStore/status`
- **MCP Server Status**: `/api/k8s-ai-assistant/mcp/status`
- **Available MCP Tools**: `/api/k8s-ai-assistant/mcp/tools`
- **List Documents**: `/api/k8s-ai-assistant/list-documents`

## API Reference

### Backend Endpoints

| Endpoint                             | Method | Description                              |
| ------------------------------------ | ------ | ---------------------------------------- |
| `/api/k8s-ai-assistant/health`       | GET    | Health check                             |
| `/api/k8s-ai-assistant/explain-logs` | POST   | Analyze Kubernetes pod logs              |
| `/api/k8s-ai-assistant/generate-yaml`| POST   | Generate Kubernetes YAML manifests       |
| `/api/k8s-ai-assistant/chat`         | POST   | General chat with MCP and RAG support    |
| `/api/k8s-ai-assistant/provider/status` | GET | Get AI provider status                   |
| `/api/k8s-ai-assistant/vectorStore/status` | GET | Get vector store and embedding status |
| `/api/k8s-ai-assistant/mcp/status`   | GET    | Get MCP server status                    |
| `/api/k8s-ai-assistant/mcp/tools`    | GET    | List available MCP tools                 |
| `/api/k8s-ai-assistant/list-documents` | GET  | List uploaded documents                  |
| `/api/k8s-ai-assistant/documents/yaml` | GET  | List only YAML documents                 |
| `/api/k8s-ai-assistant/upload-documents` | POST | Upload documents to knowledge base    |
| `/api/k8s-ai-assistant/documents/:fileName` | DELETE | Delete a document               |

### Frontend API

```typescript
import { k8sAiAssistantApiRef } from '@backstage-community/plugin-k8s-ai-assistant';

// In your component
const k8sApi = useApi(k8sAiAssistantApiRef);

// Explain logs
const response = await k8sApi.explainLogs({
  resourceType: 'pod',
  resourceName: 'my-pod',
  namespace: 'default',
  logType: 'stdout',
  messages: [{ role: 'user', content: 'Analyze these logs' }],
});

// Generate YAML
const yamlResponse = await k8sApi.generateYaml({
  messages: [{ role: 'user', content: 'Create a deployment for nginx' }],
  enableRAG: true,
});

// Send chat message
const chatResponse = await k8sApi.sendChatMessage({
  messages: [{ role: 'user', content: 'Show all pods in default namespace' }],
  enableMCPTools: true,
  enableRAG: false,
});

// Get status
const providerStatus = await k8sApi.getProviderStatus();
const vectorStoreStatus = await k8sApi.getVectorStoreStatus();
const mcpStatus = await k8sApi.getMCPServerStatus();

// Manage documents
const docs = await k8sApi.listDocuments();
await k8sApi.uploadDocuments({ files, chunkSettings });
await k8sApi.deleteDocument('filename.yaml');
```

## Contributing

Please see our [Contributing Guidelines](../../CONTRIBUTING.md) for detailed information.

### Development Guidelines

- Follow the existing code style and patterns
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting
- Use TypeScript strict mode

### Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

## Related Plugins

- **[MCP Chat](../mcp-chat/README.md)**: General-purpose AI chat with MCP support
- **[Knowledge Base Backend](../knowledge-base-backend/README.md)**: Shared RAG service

## Support and Community

- **Issues**: [Create an issue](https://github.com/backstage/community-plugins/issues)
- **Discord**: [Join our Discord](https://discord.gg/backstage)
- **Documentation**: [Backstage Documentation](https://backstage.io/docs)
- **Community**: [Backstage Community](https://backstage.io/community)

## License

This plugin is licensed under the Apache 2.0 License. See [LICENSE](../../LICENSE) for details.

---

**Built with ❤️ for the Backstage Community**
