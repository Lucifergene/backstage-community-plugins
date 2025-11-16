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

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { UnifiedMessage } from '../../../types';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: theme.palette.background.default,
    overflow: 'hidden',
  },
}));

interface ChatContainerProps {
  messages: UnifiedMessage[];
  isTyping?: boolean;
  onSendMessage: (message: string) => void;
  onInteractiveAction?: (messageId: string, action: string, payload: any) => void;
  onToolSelect?: (toolId: string) => void;
  onOpenYamlEditor?: (yaml: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isTyping = false,
  onSendMessage,
  onInteractiveAction,
  onToolSelect,
  onOpenYamlEditor,
  disabled = false,
  placeholder = 'Type your message...',
}) => {
  const classes = useStyles();

  return (
    <Box className={classes.container}>
      <MessageList
        messages={messages}
        isTyping={isTyping}
        onInteractiveAction={onInteractiveAction}
        onToolSelect={onToolSelect}
        onOpenYamlEditor={onOpenYamlEditor}
      />
      <ChatInput
        onSend={onSendMessage}
        disabled={disabled}
        placeholder={placeholder}
      />
    </Box>
  );
};

