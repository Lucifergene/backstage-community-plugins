#!/bin/bash

# Test script for MCP Chat Client Backend
# This script helps you test the different endpoints

BASE_URL="http://localhost:7007/api/mcp-chat-client"

echo "🧪 Testing MCP Chat Client Backend..."
echo "================================="

# Test 1: Configuration Status
echo "📋 1. Checking configuration status..."
curl -s "$BASE_URL/config/status" | jq '.' || echo "❌ Config status failed"
echo ""

# Test 2: Available Tools
echo "🔧 2. Checking available tools..."
curl -s "$BASE_URL/test/tools" | jq '.' || echo "❌ Tools check failed"
echo ""

# Test 3: Latest News Test
echo "📰 3. Testing latest news functionality..."
curl -s "$BASE_URL/test/latest-news" | jq '.' || echo "❌ Latest news test failed"
echo ""

echo "✅ Tests completed!"
echo ""
echo "💡 Tips:"
echo "- Make sure your Backstage backend is running on port 7007"
echo "- Ensure OPENAI_API_KEY and BRAVE_API_KEY are set"
echo "- Check the console logs for detailed error information"
