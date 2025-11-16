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

import React, { useState, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import AddCommentIcon from '@material-ui/icons/AddComment';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import IconButton from '@material-ui/core/IconButton';
import { useApi } from '@backstage/core-plugin-api';
import { k8sAiAssistantApiRef } from '../../../api';
import { TOOL_REGISTRY } from './ToolSidebar';
import { ChatContainer } from './ChatContainer';
import { YamlEditorOverlay } from './YamlEditorOverlay';
import { useChatState } from '../hooks/useChatState';
import { useToolState } from '../hooks/useToolState';
import { useOverlayState } from '../hooks/useOverlayState';
import { K8sResource } from '../utils';
import { UnifiedMessage } from '../../../types';

const useStyles = makeStyles(theme => ({
  layout: {
    display: 'flex',
    flexDirection: 'column',
    height: '600px',
    maxHeight: '600px',
  },
  fullscreenLayout: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 200px)', // Full height minus header
    maxHeight: 'calc(100vh - 200px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
  },
  togglesContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  clearButton: {
    borderRadius: theme.shape.borderRadius * 2,
    textTransform: 'none',
    fontWeight: 500,
  },
  contentArea: {
    flex: 1,
    display: 'flex',
    border: `1px solid ${theme.palette.divider}`,
    borderTop: 'none',
    borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`,
    overflow: 'hidden',
  },
  chatCard: {
    flex: 1,
    backgroundColor: theme.palette.background.default,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  yamlButton: {
    marginTop: theme.spacing(1),
    justifyContent: 'flex-start',
    textTransform: 'none',
  },
}));

interface UnifiedChatLayoutProps {
  k8sResources: K8sResource[];
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export const UnifiedChatLayout: React.FC<UnifiedChatLayoutProps> = ({
  k8sResources,
  onFullscreenChange,
}) => {
  const classes = useStyles();
  const k8sApi = useApi(k8sAiAssistantApiRef);

  // State management hooks
  const { messages, addMessage, clearMessages } = useChatState();
  const { activeTool, setActiveTool, getToolState, updateToolState } =
    useToolState();
  const { overlay, openEditor, closeEditor, updateContent } = useOverlayState();

  // Local state
  const [isTyping, setIsTyping] = useState(false);
  const [lastYamlGenerated, setLastYamlGenerated] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Universal toggles (above chat)
  const [universalRAG, setUniversalRAG] = useState(true);
  const [universalMCP, setUniversalMCP] = useState(true);

  // Handle tool selection - add interactive message
  const handleToolSelect = useCallback(
    (toolId: string) => {
      setActiveTool(toolId);

      // Add interactive bot message based on tool
      const tool = TOOL_REGISTRY.find(t => t.id === toolId);
      if (tool) {
        let interactiveMessage: UnifiedMessage | null = null;

        if (toolId === 'pod-logs') {
          interactiveMessage = {
            id: `interactive-${Date.now()}`,
            role: 'assistant',
            content: 'Select a pod to analyze its logs:',
            toolContext: { toolId },
            timestamp: new Date(),
            interactiveComponent: 'pod-selector',
            interactiveData: { k8sResources },
          };
        } else if (toolId === 'yaml-gen') {
          interactiveMessage = {
            id: `interactive-${Date.now()}`,
            role: 'assistant',
            content: `Let's generate Kubernetes YAML!${
              universalRAG ? ' (Using Knowledge Base)' : ''
            }`,
            toolContext: { toolId },
            timestamp: new Date(),
            interactiveComponent: 'yaml-mode-selector',
            interactiveData: { enableRAG: universalRAG },
          };
        }

        if (interactiveMessage) {
          addMessage(interactiveMessage);
        }
      }
    },
    [setActiveTool, addMessage, k8sResources, universalRAG],
  );

  // Handle clear conversation
  const handleClear = useCallback(() => {
    clearMessages();
    setActiveTool(null);
  }, [clearMessages, setActiveTool]);

  // Pod Log Analysis Handler
  const handlePodLogAnalyze = useCallback(
    async (podName: string, namespace: string, logType: string) => {
      const userMessage: UnifiedMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: `Analyze logs for pod: ${podName} (${logType})`,
        toolContext: {
          toolId: 'pod-logs',
          data: { podName, namespace, logType },
        },
        timestamp: new Date(),
      };

      addMessage(userMessage);
      setIsTyping(true);

      try {
        const response = await k8sApi.explainLogs({
          resourceType: 'Pod',
          resourceName: podName,
          namespace,
          logType: logType as 'stdout' | 'stderr' | 'both',
          messages: [
            { role: 'user', content: 'Show me any errors in the logs' },
          ],
        });

        const assistantMessage: UnifiedMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: response.content,
          toolContext: {
            toolId: 'pod-logs',
            data: { podName, namespace, logType },
          },
          timestamp: new Date(),
          toolsUsed: response.toolsUsed,
          toolResponses: response.toolResponses,
        };

        addMessage(assistantMessage);
      } catch (error) {
        const errorMessage: UnifiedMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `Error analyzing logs: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          toolContext: {
            toolId: 'pod-logs',
            data: { podName, namespace, logType },
          },
          timestamp: new Date(),
        };
        addMessage(errorMessage);
      } finally {
        setIsTyping(false);
      }
    },
    [k8sApi, addMessage],
  );

  // YAML Generation Handler
  const handleYamlGenerate = useCallback(
    async (prompt: string) => {
      const userMessage: UnifiedMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: prompt,
        toolContext: { toolId: 'yaml-gen', data: { enableRAG: universalRAG } },
        timestamp: new Date(),
      };

      addMessage(userMessage);
      setIsTyping(true);

      try {
        const response = await k8sApi.generateYaml({
          messages: [{ role: 'user', content: prompt }],
          enableRAG: universalRAG,
          ragConfig: universalRAG ? { topK: 3 } : undefined,
        });

        const assistantMessage: UnifiedMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: response.content,
          toolContext: { toolId: 'yaml-gen' },
          timestamp: new Date(),
          yamlBlocks: response.yamlBlocks,
          ragDocuments: response.ragContext,
          ragEnabled: universalRAG,
        };

        addMessage(assistantMessage);

        // Save last YAML for editor
        if (response.yamlBlocks && response.yamlBlocks.length > 0) {
          setLastYamlGenerated(response.yamlBlocks[0]);
        }
      } catch (error) {
        const errorMessage: UnifiedMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `Error generating YAML: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          toolContext: { toolId: 'yaml-gen' },
          timestamp: new Date(),
        };
        addMessage(errorMessage);
      } finally {
        setIsTyping(false);
      }
    },
    [k8sApi, addMessage, universalRAG],
  );

  // General Chat Message Handler
  const handleChatMessage = useCallback(
    async (message: string) => {
      const toolId = activeTool || 'general-chat';
      const userMessage: UnifiedMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: message,
        toolContext: { toolId },
        timestamp: new Date(),
      };

      addMessage(userMessage);
      setIsTyping(true);

      try {
        // Extract tool-specific messages and context
        const toolMessages = messages.filter(
          m => m.toolContext?.toolId === toolId,
        );
        const toolContextData = toolMessages.find(m => m.toolContext?.data)
          ?.toolContext?.data;

        // Route to appropriate API based on active tool
        if (toolId === 'general-chat') {
          const response = await k8sApi.sendChatMessage({
            messages: messages
              .filter(m => m.role !== 'system')
              .map(m => ({ role: m.role, content: m.content }))
              .concat([{ role: 'user', content: message }]),
            enableMCPTools: universalMCP,
            enableRAG: universalRAG,
            ragConfig: universalRAG ? { topK: 3 } : undefined,
          });

          const assistantMessage: UnifiedMessage = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            content: response.content,
            toolContext: { toolId },
            timestamp: new Date(),
            toolsUsed: response.toolsUsed,
            toolResponses: response.toolResponses,
            ragDocuments: response.ragContext,
            ragEnabled: universalRAG,
          };

          addMessage(assistantMessage);
        } else if (toolId === 'pod-logs') {
          // Handle pod logs follow-up messages
          const { podName, namespace, logType } = toolContextData || {};

          if (!podName || !namespace || !logType) {
            throw new Error(
              'Pod context not found. Please select a pod first.',
            );
          }

          // Build conversation history from tool-specific messages
          const conversationHistory = toolMessages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            }))
            .concat([{ role: 'user', content: message }]);

          const response = await k8sApi.explainLogs({
            resourceType: 'Pod',
            resourceName: podName,
            namespace,
            logType: logType as 'stdout' | 'stderr' | 'both',
            messages: conversationHistory,
          });

          const assistantMessage: UnifiedMessage = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            content: response.content,
            toolContext: { toolId, data: toolContextData },
            timestamp: new Date(),
            toolsUsed: response.toolsUsed,
            toolResponses: response.toolResponses,
          };

          addMessage(assistantMessage);
        } else if (toolId === 'yaml-gen') {
          // Handle YAML generation follow-up messages
          // Build conversation history from tool-specific messages
          const conversationHistory = toolMessages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            }))
            .concat([{ role: 'user', content: message }]);

          const response = await k8sApi.generateYaml({
            messages: conversationHistory,
            enableRAG: universalRAG,
            ragConfig: universalRAG ? { topK: 3 } : undefined,
          });

          const assistantMessage: UnifiedMessage = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            content: response.content,
            toolContext: { toolId },
            timestamp: new Date(),
            yamlBlocks: response.yamlBlocks,
            ragDocuments: response.ragContext,
            ragEnabled: universalRAG,
          };

          addMessage(assistantMessage);

          // Save last YAML for editor
          if (response.yamlBlocks && response.yamlBlocks.length > 0) {
            setLastYamlGenerated(response.yamlBlocks[0]);
          }
        }
      } catch (error) {
        const errorMessage: UnifiedMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `Error: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          toolContext: { toolId },
          timestamp: new Date(),
        };
        addMessage(errorMessage);
      } finally {
        setIsTyping(false);
      }
    },
    [k8sApi, addMessage, messages, activeTool, universalMCP, universalRAG],
  );

  // Open YAML in editor
  const handleOpenYamlEditor = useCallback(
    (yaml: string) => {
      openEditor(yaml);
    },
    [openEditor],
  );

  // Handle interactive component actions
  const handleInteractiveAction = useCallback(
    async (messageId: string, action: string, payload: any) => {
      if (action === 'analyze-logs') {
        await handlePodLogAnalyze(
          payload.podName,
          payload.namespace,
          payload.logType,
        );
      } else if (action === 'generate-yaml') {
        await handleYamlGenerate(payload.prompt);
      }
      // Note: toggle actions removed - using universal toggles now
    },
    [handlePodLogAnalyze, handleYamlGenerate],
  );

  // Enhanced message rendering with YAML action buttons
  const enhancedMessages = React.useMemo(() => {
    return messages.map(msg => {
      // Store last YAML for quick access
      if (
        msg.yamlBlocks &&
        msg.yamlBlocks.length > 0 &&
        msg.role === 'assistant'
      ) {
        setLastYamlGenerated(msg.yamlBlocks[0]);
      }
      return msg;
    });
  }, [messages]);

  return (
    <Box className={isFullscreen ? classes.fullscreenLayout : classes.layout}>
      {/* Header with controls */}
      <Box className={classes.header}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddCommentIcon />}
          onClick={handleClear}
          className={classes.clearButton}
        >
          New Chat
        </Button>
        <Box className={classes.togglesContainer}>
          <FormControlLabel
            control={
              <Switch
                checked={universalMCP}
                onChange={e => setUniversalMCP(e.target.checked)}
                color="primary"
                size="small"
              />
            }
            label={<Typography variant="body2">MCP Server</Typography>}
          />
          <FormControlLabel
            control={
              <Switch
                checked={universalRAG}
                onChange={e => setUniversalRAG(e.target.checked)}
                color="primary"
                size="small"
              />
            }
            label={<Typography variant="body2">Knowledge Base</Typography>}
          />
          <IconButton
            size="small"
            onClick={() => {
              const newFullscreenState = !isFullscreen;
              setIsFullscreen(newFullscreenState);
              onFullscreenChange?.(newFullscreenState);
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Content Area - Chat + Editor side by side */}
      <Box className={classes.contentArea}>
        <Box className={classes.chatCard}>
          <ChatContainer
            messages={enhancedMessages}
            isTyping={isTyping}
            onSendMessage={handleChatMessage}
            onInteractiveAction={handleInteractiveAction}
            onToolSelect={handleToolSelect}
            onOpenYamlEditor={handleOpenYamlEditor}
            disabled={isTyping}
            placeholder={
              activeTool === 'yaml-gen'
                ? 'Ask me to generate Kubernetes YAML...'
                : activeTool === 'pod-logs'
                ? 'Ask about logs...'
                : 'Ask about Kubernetes...'
            }
          />
        </Box>

        {/* YAML Editor - Side by side with chat */}
        {overlay.isOpen && overlay.type === 'yaml-editor' && (
          <YamlEditorOverlay
            yaml={overlay.content}
            onClose={closeEditor}
            onSave={content => {
              updateContent(content);
              // Could add logic to save to file system or clipboard here
            }}
          />
        )}
      </Box>
    </Box>
  );
};
