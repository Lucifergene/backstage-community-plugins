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
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import PersonIcon from '@material-ui/icons/Person';
import BotIcon from '@material-ui/icons/Android';

const useStyles = makeStyles(theme => ({
  messageContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  userMessageContainer: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    fontSize: '1rem',
    marginTop: theme.spacing(0.25), // Small margin to align with text baseline
  },
  userAvatar: {
    backgroundColor: '#4CAF50',
  },
  botAvatar: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  messageCard: {
    maxWidth: '100%',
    position: 'relative',
    boxShadow: 'none',
    backgroundColor: 'transparent',
  },
  userMessage: {
    backgroundColor: 'transparent',
    color: 'inherit',
    boxShadow: 'none',
    '& .MuiCardContent-root': {
      padding: theme.spacing(0, 0),
      '&:last-child': {
        paddingBottom: theme.spacing(0),
      },
    },
  },
  botMessage: {
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    '& .MuiCardContent-root': {
      padding: theme.spacing(0, 0),
      '&:last-child': {
        paddingBottom: theme.spacing(0),
      },
    },
  },
  messageActions: {
    display: 'flex',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(1),
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  messageCardHover: {
    '&:hover $messageActions': {
      opacity: 1,
    },
  },
  timestamp: {
    fontSize: '0.75rem',
    color: '#999',
    marginTop: theme.spacing(0.5),
  },
  toolChip: {
    height: 20,
    fontSize: '0.81rem',
    fontWeight: 550,
    backgroundColor: '#e8f5e8',
    color: '#4CAF50',
    marginRight: theme.spacing(0.5),
    marginTop: theme.spacing(0.5),
  },
  codeBlock: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: theme.spacing(0.5),
    padding: theme.spacing(1),
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    margin: theme.spacing(1, 0),
    overflow: 'auto',
  },
  tooltipCodeBlock: {
    backgroundColor: '#f8f9fa',
    color: '#333',
    border: '1px solid #e9ecef',
    padding: theme.spacing(0.75),
    borderRadius: theme.spacing(0.5),
    fontFamily: 'monospace',
    fontSize: '0.7rem',
    whiteSpace: 'pre-wrap',
    maxWidth: '450px',
    minWidth: '350px',
    lineHeight: 1.2,
  },
  tooltip: {
    backgroundColor: '#fff',
    color: '#333',
    border: '1px solid #ddd',
    fontSize: '0.75rem',
    maxWidth: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
}));

interface ChatMessageProps {
  message: {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    tools?: string[];
  };
  onFeedback?: (messageId: string, type: 'like' | 'dislike') => void;
  onCopy?: (text: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const classes = useStyles();

  const getDummyJsonForTool = (toolName: string) => {
    const dummyData = {
      tool: toolName,
      version: '1.0.0',
      parameters: {
        input: 'sample input data',
        options: {
          format: 'json',
          verbose: true,
        },
      },
      response: {
        status: 'success',
        data: 'sample response data',
        timestamp: new Date().toISOString(),
      },
    };
    return JSON.stringify(dummyData, null, 2);
  };

  const formatMessage = (text: string) => {
    // Simple formatting for code blocks
    if (text.includes('```')) {
      const parts = text.split('```');
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <pre key={index} className={classes.codeBlock}>
              {part}
            </pre>
          );
        }
        return (
          <Typography key={index} variant="body1" component="span">
            {part}
          </Typography>
        );
      });
    }
    return <Typography variant="body1">{text}</Typography>;
  };

  return (
    <Box className={classes.messageContainer}>
      <Avatar
        className={`${classes.avatar} ${
          message.isUser ? classes.userAvatar : classes.botAvatar
        }`}
      >
        {message.isUser ? <PersonIcon /> : <BotIcon />}
      </Avatar>

      <Box>
        <Card
          className={`${classes.messageCard} ${classes.messageCardHover} ${
            message.isUser ? classes.userMessage : classes.botMessage
          }`}
        >
          <CardContent style={{ paddingTop: 5 }}>
            {formatMessage(message.text)}

            {message.tools && message.tools.length > 0 && (
              <Box>
                {message.tools.map(tool => (
                  <Tooltip
                    key={tool}
                    title={
                      <div className={classes.tooltipCodeBlock}>
                        {getDummyJsonForTool(tool)}
                      </div>
                    }
                    classes={{ tooltip: classes.tooltip }}
                    placement="top"
                    arrow
                  >
                    <Chip
                      label={tool}
                      size="small"
                      className={classes.toolChip}
                      clickable
                    />
                  </Tooltip>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
