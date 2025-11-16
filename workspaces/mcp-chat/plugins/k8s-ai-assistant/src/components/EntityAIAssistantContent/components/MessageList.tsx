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

import React, { useEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ToolSeparator } from './ToolSeparator';
import { InteractiveMessageContent } from './InteractiveMessageContent';
import { UnifiedMessage } from '../../../types';
import { TOOL_REGISTRY } from './ToolSidebar';

const useStyles = makeStyles(theme => ({
  container: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    alignItems: 'flex-start',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: '900px',
    paddingLeft: theme.spacing(2),
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    flexDirection: 'column',
    gap: theme.spacing(2),
    color: theme.palette.text.secondary,
    textAlign: 'center',
    padding: theme.spacing(4),
    backgroundColor: theme.palette.background.paper,
    width: '100%',
  },
  welcomeTitle: {
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
  welcomeSubtitle: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(3),
  },
  toolCardsGrid: {
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'center',
    marginTop: theme.spacing(3),
  },
  toolCard: {
    padding: theme.spacing(1.5, 2.5),
    borderRadius: theme.shape.borderRadius * 3,
    backgroundColor: theme.palette.background.default,
    border: `1px solid ${theme.palette.divider}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.action.hover,
    },
  },
  toolIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  toolTextContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  toolName: {
    fontWeight: 600,
    fontSize: '0.875rem',
    color: theme.palette.text.primary,
    whiteSpace: 'nowrap',
  },
  toolDescription: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
  },
}));

interface MessageListProps {
  messages: UnifiedMessage[];
  isTyping?: boolean;
  emptyStateMessage?: string;
  onInteractiveAction?: (messageId: string, action: string, payload: any) => void;
  onToolSelect?: (toolId: string) => void;
  onOpenYamlEditor?: (yaml: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping = false,
  emptyStateMessage = 'Start a conversation...',
  onInteractiveAction,
  onToolSelect,
  onOpenYamlEditor,
}) => {
  const classes = useStyles();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const renderMessage = (message: UnifiedMessage, index: number) => {
    const elements: React.ReactNode[] = [];

    // Check if tool changed from previous message
    if (index > 0) {
      const prevToolId = messages[index - 1]?.toolContext?.toolId;
      const currentToolId = message.toolContext?.toolId;

      if (prevToolId !== currentToolId && currentToolId) {
        const tool = TOOL_REGISTRY.find(t => t.id === currentToolId);
        if (tool) {
          elements.push(
            <ToolSeparator
              key={`separator-${message.id}`}
              toolName={tool.name}
              toolIcon={tool.icon}
            />,
          );
        }
      }
    }

    // Render the message
    elements.push(
      <Box key={message.id}>
        <ChatMessage
          message={{
            id: message.id,
            text: message.content,
            isUser: message.role === 'user',
            timestamp: message.timestamp,
            ragDocuments: message.ragDocuments,
            ragEnabled: message.ragEnabled,
            toolsUsed: message.toolsUsed,
            toolResponses: message.toolResponses,
            yamlBlocks: message.yamlBlocks,
          }}
          onOpenYamlEditor={onOpenYamlEditor}
        />
        {/* Render interactive component if present - aligned with bot message */}
        {message.interactiveComponent && message.interactiveData && onInteractiveAction && (
          <Box display="flex" alignItems="flex-start" gap={2}>
            <Box width={32} flexShrink={0} />
            <Box flex={1}>
              <InteractiveMessageContent
                type={message.interactiveComponent}
                data={message.interactiveData}
                onAction={(action, payload) => onInteractiveAction(message.id, action, payload)}
              />
            </Box>
          </Box>
        )}
      </Box>,
    );

    return elements;
  };

  if (messages.length === 0 && !isTyping) {
    return (
      <Box className={classes.container} style={{ alignItems: 'center' }}>
        <Box className={classes.emptyState}>
          <Typography variant="h5" className={classes.welcomeTitle}>
            Welcome to Kubernetes AI Assistant
          </Typography>
          <Typography variant="body2" className={classes.welcomeSubtitle}>
            Ask me anything about Kubernetes, troubleshooting, or best practices.
          </Typography>
          <Typography variant="body2" className={classes.welcomeSubtitle}>
            Start chatting below or select one of the tools to get started.
          </Typography>
          
          {/* Tool Cards */}
          <Box className={classes.toolCardsGrid}>
            {TOOL_REGISTRY.map(tool => (
              <Box
                key={tool.id}
                className={classes.toolCard}
                onClick={() => onToolSelect && onToolSelect(tool.id)}
              >
                <Box className={classes.toolIcon}>{tool.icon}</Box>
                <Box className={classes.toolTextContainer}>
                  <Typography className={classes.toolName}>{tool.name}</Typography>
                  <Typography className={classes.toolDescription}>
                    • {tool.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box className={classes.container}>
      <Box className={classes.contentWrapper}>
        {messages.map((message, index) => renderMessage(message, index))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </Box>
    </Box>
  );
};

