# MCP Chat Client Configuration

This document explains how to configure the MCP Chat Client backend to work with different MCP servers.

## App Config Structure

Add the following to your `app-config.yaml`:

```yaml
mcpChat:
  providers:
    - id: openai
      token: ${OPENAI_API_KEY}
      model: gpt-4o-mini
  mcpServers:
    - id: brave-search-server
      name: Brave Search Server
      npxCommand: '@modelcontextprotocol/server-brave-search@latest'
      env:
        BRAVE_API_KEY: ${BRAVE_API_KEY}
    - id: kubernetes-server
      name: Kubernetes Server
      npxCommand: 'kubernetes-mcp-server@latest'
    - id: backstage-server
      name: Backstage Server
      url: 'http://localhost:7007/api/mcp-actions/v1'
      headers:
        Authorization: 'Bearer your-token'
```

## Environment Variables Required

Make sure to set these environment variables:

```bash
# OpenAI API Key (required for LLM provider)
export OPENAI_API_KEY="your-openai-api-key"

# Brave Search API Key (required for news search functionality)
export BRAVE_API_KEY="your-brave-search-api-key"
```

## Getting API Keys

### OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up/login to your account
3. Navigate to API Keys section
4. Create a new API key

### Brave Search API Key

1. Go to [Brave Search API](https://api.search.brave.com/)
2. Sign up for a developer account
3. Create a new API key
4. Note: Brave Search API has a free tier with limited requests

## MCP Server Types

### STDIO (Default)

Uses `npxCommand` to run MCP servers as child processes:

```yaml
- id: brave-search-server
  name: Brave Search Server
  npxCommand: '@modelcontextprotocol/server-brave-search@latest'
  env:
    BRAVE_API_KEY: ${BRAVE_API_KEY}
```

### Streamable HTTP

Uses `url` to connect to MCP servers over Streamable HTTP:

```yaml
- id: backstage-server
  name: Backstage Server
  url: 'http://localhost:7007/api/mcp-actions/v1'
  headers:
    Authorization: 'Bearer your-token'
```

### SSE (Server-Sent Events)

Uses `url` with `type: sse` for real-time connections:

```yaml
- id: sse-server
  name: SSE Server
  url: 'http://localhost:8080/sse'
  type: sse
```

## Test Endpoints

### Configuration Status

Check if your configuration is loaded correctly:

```bash
curl http://localhost:7007/api/mcp-chat-client/config/status
```

### Available Tools

See what tools are available from your MCP servers:

```bash
curl http://localhost:7007/api/mcp-chat-client/test/tools
```

### Latest News Test

Test the Brave Search integration with the latest news prompt:

```bash
curl http://localhost:7007/api/mcp-chat-client/test/latest-news
```

This endpoint will:

1. Connect to the Brave Search MCP server
2. Use the LLM to understand the news request
3. Call the appropriate search tools
4. Return formatted news results

## Troubleshooting

### Common Issues

1. **"No tools were called"**

   - Check that your API keys are set correctly
   - Verify MCP server configurations in app-config
   - Check console logs for connection errors

2. **"Failed to initialize LLM provider"**

   - Ensure `OPENAI_API_KEY` is set
   - Check that the model name is correct

3. **"MCP server connection failed"**
   - For `npxCommand` servers: ensure the package exists and can be installed
   - For HTTP servers: verify the URL is accessible
   - Check that required environment variables are set

### Debug Logs

The backend logs detailed information to the console. Look for:

- "MCP Server connected with tools: [tool names]"
- "Using LLM Provider: openai, Model: gpt-4o-mini"
- Tool call details and responses

## Supported MCP Servers

- **Brave Search**: Web search and news
- **Kubernetes**: Cluster management and querying
- **Backstage**: Integration with Backstage APIs
- **Custom HTTP**: Any MCP-compatible HTTP server

Add more servers by following the configuration patterns above.
