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
import { InputError } from '@backstage/errors';
import express from 'express';
import Router from 'express-promise-router';
import { K8sLogService } from './services/K8sLogService';
import { K8sYamlService } from './services/K8sYamlService';
import { K8sAiAssistantService } from './services/K8sAiAssistantService';
import { KnowledgeBaseService } from '@internal/backstage-plugin-knowledge-base-backend';
import { K8sGeneralChatService } from './services/K8sGeneralChatService';
import {
  LogExplainRequest,
  YamlGenerateRequest,
  GeneralChatRequest,
} from './types';

export async function createRouter({
  logger,
  k8sAiAssistantService,
  k8sLogService,
  k8sYamlService,
  k8sGeneralChatService,
  knowledgeBaseService,
}: {
  logger: LoggerService;
  k8sAiAssistantService: K8sAiAssistantService;
  k8sLogService: K8sLogService;
  k8sYamlService: K8sYamlService;
  k8sGeneralChatService: K8sGeneralChatService;
  knowledgeBaseService: KnowledgeBaseService | null;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  // Health check endpoint
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Explain logs endpoint
  router.post('/explain-logs', async (req, res) => {
    logger.info('POST /explain-logs');

    const { resourceType, resourceName, namespace, logType, messages } =
      req.body as LogExplainRequest;

    // Validation
    if (!resourceType || !resourceName || !namespace || !logType) {
      throw new InputError(
        'Missing required fields: resourceType, resourceName, namespace, logType',
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new InputError('messages must be a non-empty array');
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        throw new InputError('Each message must have role and content');
      }
      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        throw new InputError('Message role must be user, assistant, or system');
      }
    }

    try {
      const response = await k8sLogService.explainLogs(req.body);
      res.json(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error explaining logs: ${errorMessage}`);
      res.status(500).json({
        error: 'Failed to explain logs',
        message: errorMessage,
      });
    }
  });

  // Generate YAML endpoint
  router.post('/generate-yaml', async (req, res) => {
    logger.info('POST /generate-yaml');

    const { messages } = req.body as YamlGenerateRequest;

    // Validation
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new InputError('messages must be a non-empty array');
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        throw new InputError('Each message must have role and content');
      }
      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        throw new InputError('Message role must be user, assistant, or system');
      }
    }

    try {
      const response = await k8sYamlService.generateYaml(req.body);
      res.json(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error generating YAML: ${errorMessage}`);
      res.status(500).json({
        error: 'Failed to generate YAML',
        message: errorMessage,
      });
    }
  });

  // General chat endpoint
  router.post('/chat', async (req, res) => {
    logger.info('POST /chat');

    const { messages, enableMCPTools, enableRAG } =
      req.body as GeneralChatRequest;

    // Validation
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new InputError('messages must be a non-empty array');
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role) {
        throw new InputError('Each message must have a role');
      }
      if (!['user', 'assistant', 'system', 'tool'].includes(msg.role)) {
        throw new InputError(
          'Message role must be user, assistant, system, or tool',
        );
      }
    }

    // Validate boolean flags
    if (typeof enableMCPTools !== 'boolean') {
      throw new InputError('enableMCPTools must be a boolean');
    }
    if (typeof enableRAG !== 'boolean') {
      throw new InputError('enableRAG must be a boolean');
    }

    try {
      const response = await k8sGeneralChatService.sendChatMessage(req.body);
      res.json(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error processing chat message: ${errorMessage}`);
      res.status(500).json({
        error: 'Failed to process chat message',
        message: errorMessage,
      });
    }
  });

  // Provider status endpoint
  router.get('/provider/status', async (_req, res) => {
    logger.info('GET /provider/status');
    const status = await k8sAiAssistantService.getProviderStatus();
    res.json(status);
  });

  // Vector store status endpoint (includes embedding config)
  router.get('/vectorStore/status', async (_req, res) => {
    logger.info('GET /vectorStore/status');
    const status = await k8sAiAssistantService.getVectorStoreStatus();
    res.json(status);
  });

  // MCP server status endpoint
  router.get('/mcp/status', async (_req, res) => {
    logger.info('GET /mcp/status');
    const status = await k8sAiAssistantService.getMCPServerStatus();
    res.json(status);
  });

  // MCP tools endpoint
  router.get('/mcp/tools', async (_req, res) => {
    logger.info('GET /mcp/tools');
    const tools = k8sAiAssistantService.getAvailableTools();
    logger.info(`Available MCP tools: ${tools.length} tools`, { 
      tools: tools.map((t: any) => t.function?.name || 'unknown') 
    });
    res.json({
      availableTools: tools,
      toolCount: tools.length,
      timestamp: new Date().toISOString(),
    });
  });

  // List uploaded documents endpoint
  router.get('/list-documents', async (req, res) => {
    logger.info('GET /list-documents');

    // Check if knowledge base service is available
    if (!knowledgeBaseService) {
      res.status(503).json({
        success: false,
        error: 'Knowledge base service not available',
        details: 'Knowledge base is not configured',
      });
      return;
    }

    try {
      const namespace = req.query.namespace as string | undefined;
      const documents = await knowledgeBaseService.listDocuments(namespace);

      res.json({
        success: true,
        documents,
        totalDocuments: documents.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error listing documents: ${errorMessage}`);
      res.status(500).json({
        success: false,
        error: 'Failed to list documents',
        details: errorMessage,
      });
    }
  });

  // List YAML documents endpoint (filtered)
  router.get('/documents/yaml', async (req, res) => {
    logger.info('GET /documents/yaml');

    // Check if knowledge base service is available
    if (!knowledgeBaseService) {
      res.status(503).json({
        success: false,
        error: 'Knowledge base service not available',
        details: 'Knowledge base is not configured',
      });
      return;
    }

    try {
      const namespace = req.query.namespace as string | undefined;
      const allDocuments = await knowledgeBaseService.listDocuments(namespace);
      
      // Filter to only YAML documents
      const yamlDocuments = allDocuments.filter(
        doc => doc.format === 'yaml',
      );

      res.json({
        success: true,
        documents: yamlDocuments,
        totalDocuments: yamlDocuments.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error listing YAML documents: ${errorMessage}`);
      res.status(500).json({
        success: false,
        error: 'Failed to list YAML documents',
        details: errorMessage,
      });
    }
  });

  // Upload documents endpoint
  router.post('/upload-documents', async (req, res) => {
    logger.info('POST /upload-documents');

    // Check if knowledge base service is available
    if (!knowledgeBaseService) {
      res.status(503).json({
        success: false,
        error: 'Document upload not available',
        details: 'Knowledge base is not configured',
      });
      return;
    }

    const { files, chunkSettings } = req.body;

    // Validation
    if (!Array.isArray(files) || files.length === 0) {
      throw new InputError('files must be a non-empty array');
    }

    if (!chunkSettings || !chunkSettings.maxChunkLength) {
      throw new InputError('chunkSettings with maxChunkLength is required');
    }

    // Validate each file has content and fileName
    for (const file of files) {
      if (!file.content || !file.fileName) {
        throw new InputError(
          'Each file must have content and fileName properties',
        );
      }
    }

    try {
      const uploadedDocs = await knowledgeBaseService.uploadDocuments(files, {
        maxChunkLength: chunkSettings.maxChunkLength || 1000,
        chunkOverlap: chunkSettings.chunkOverlap || 200,
        delimiter: chunkSettings.delimiter || '\n',
      });

      res.json({
        success: true,
        uploadedDocuments: uploadedDocs,
        totalUploaded: uploadedDocs.length,
        totalFailed: files.length - uploadedDocs.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error uploading documents: ${errorMessage}`);
      res.status(500).json({
        success: false,
        error: 'Failed to upload documents',
        details: errorMessage,
      });
    }
  });

  // Delete document endpoint
  router.delete('/documents/:fileName', async (req, res) => {
    const { fileName } = req.params;
    logger.info(`DELETE /documents/${fileName}`);

    // Check if knowledge base service is available
    if (!knowledgeBaseService) {
      res.status(503).json({
        success: false,
        error: 'Knowledge base service not available',
        details: 'Knowledge base is not configured',
      });
      return;
    }

    // Validation
    if (!fileName || fileName.trim() === '') {
      throw new InputError('fileName parameter is required');
    }

    try {
      const result = await knowledgeBaseService.deleteDocument(
        decodeURIComponent(fileName),
      );

      res.json({
        success: true,
        deletedCount: result.deletedCount,
        fileName: decodeURIComponent(fileName),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error deleting document ${fileName}: ${errorMessage}`);
      res.status(500).json({
        success: false,
        error: 'Failed to delete document',
        details: errorMessage,
      });
    }
  });

  return router;
}
