import React, { useState, useEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import SendIcon from '@material-ui/icons/Send';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { K8sResource } from '../utils';
import { useApi } from '@backstage/core-plugin-api';
import { k8sAiAssistantApiRef } from '../../../api';

const useStyles = makeStyles(theme => ({
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '600px',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  inputContainer: {
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  textField: {
    flex: 1,
    '& .MuiOutlinedInput-root': {
      borderRadius: theme.spacing(3),
      backgroundColor: theme.palette.action.hover,
    },
  },
  sendButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '&:disabled': {
      backgroundColor: theme.palette.action.disabledBackground,
      color: theme.palette.text.disabled,
    },
  },
}));

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface LogsChatProps {
  selectedResourceType: string;
  specificResource: string;
  logType: string;
  k8sResources: K8sResource[];
  initialPrompt?: string;
  onPromptSent?: () => void;
}

export const LogsChat: React.FC<LogsChatProps> = ({
  selectedResourceType,
  specificResource,
  logType,
  k8sResources,
  initialPrompt,
  onPromptSent,
}) => {
  const classes = useStyles();
  const k8sApi = useApi(k8sAiAssistantApiRef);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const hasInitialPromptRun = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset messages when resource changes
  useEffect(() => {
    setMessages([]);
    hasInitialPromptRun.current = false;
  }, [selectedResourceType, specificResource]);

  // Send initial prompt automatically when "Explain Logs" button is clicked
  useEffect(() => {
    const sendInitialPrompt = async () => {
      if (!initialPrompt || hasInitialPromptRun.current || isTyping) return;

      hasInitialPromptRun.current = true;

      const userMessage: Message = {
        id: Date.now().toString(),
        text: initialPrompt,
        isUser: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);

      try {
        const resource = k8sResources.find(
          r => r.kind === selectedResourceType && r.name === specificResource,
        );

        if (!resource) {
          throw new Error('Resource not found in k8sResources array');
        }

        const data = await k8sApi.explainLogs({
          resourceType: selectedResourceType,
          resourceName: specificResource,
          namespace: resource.namespace,
          logType: logType as 'stdout' | 'stderr' | 'both',
          messages: [
            {
              role: 'user',
              content: initialPrompt,
            },
          ],
        });

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.content,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error('Error calling explain logs API:', error);

        let errorText =
          'Sorry, I encountered an error analyzing the logs. Please try again.';
        if (error instanceof Error) {
          errorText = `Error: ${error.message}`;
        }

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: errorText,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
        onPromptSent?.();
      }
    };

    sendInitialPrompt();
  }, [
    initialPrompt,
    isTyping,
    selectedResourceType,
    specificResource,
    logType,
    k8sResources,
    k8sApi,
    onPromptSent,
  ]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Find the selected resource details
      const resource = k8sResources.find(
        r => r.kind === selectedResourceType && r.name === specificResource,
      );

      if (!resource) {
        console.error('Resource not found:', {
          selectedResourceType,
          specificResource,
          availableResources: k8sResources.map(r => ({
            kind: r.kind,
            name: r.name,
          })),
        });
        throw new Error('Resource not found in k8sResources array');
      }

      console.log('Calling API with:', {
        resourceType: selectedResourceType,
        resourceName: specificResource,
        namespace: resource.namespace,
        logType: logType,
      });

      // Call backend API
      const data = await k8sApi.explainLogs({
        resourceType: selectedResourceType,
        resourceName: specificResource,
        namespace: resource.namespace,
        logType: logType as 'stdout' | 'stderr' | 'both',
        messages: messages
          .map(m => ({
            role: m.isUser ? ('user' as const) : ('assistant' as const),
            content: m.text,
          }))
          .concat([
            {
              role: 'user' as const,
              content: inputValue,
            },
          ]),
      });

      console.log('API response data:', data);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.content,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling explain logs API:', error);

      let errorText =
        'Sorry, I encountered an error analyzing the logs. Please try again.';
      if (error instanceof Error) {
        errorText = `Error: ${error.message}`;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box className={classes.chatContainer}>
      <Box className={classes.messagesContainer}>
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: (theme: any) => theme.palette.text.secondary,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2">
              Ask me anything about the logs for{' '}
              <strong>
                {selectedResourceType}/{specificResource}
              </strong>
              <br />
              (Log type: {logType})
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      <Box className={classes.inputContainer}>
        <TextField
          className={classes.textField}
          placeholder="Ask about logs..."
          variant="outlined"
          multiline
          maxRows={4}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          size="small"
          disabled={isTyping}
        />
        <IconButton
          className={classes.sendButton}
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isTyping}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};
