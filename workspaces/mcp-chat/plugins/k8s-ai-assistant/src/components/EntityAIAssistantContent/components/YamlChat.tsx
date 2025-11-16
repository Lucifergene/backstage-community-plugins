import React, { useState, useEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import SendIcon from '@material-ui/icons/Send';
import AddIcon from '@material-ui/icons/Add';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
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
    '& > *': {
      marginBottom: theme.spacing(1),
    },
  },
  inputContainer: {
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    alignItems: 'center',
    '& > *:not(:last-child)': {
      marginRight: theme.spacing(1),
    },
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
  yamlButton: {
    justifyContent: 'flex-start',
    textTransform: 'none',
    borderColor: theme.palette.primary.main,
    marginTop: theme.spacing(1),
  },
}));

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  yamlBlocks?: string[];
}

interface YamlChatProps {
  onYamlAdd: (yaml: string) => void;
  initialPrompt?: string;
  onPromptSent?: () => void;
  enableRAG?: boolean;
}

export const YamlChat: React.FC<YamlChatProps> = ({
  onYamlAdd,
  initialPrompt,
  onPromptSent,
  enableRAG = false,
}) => {
  const ragTopK = 3; // Default to 3 examples
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

  // Auto-send initial prompt from quick prompts
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
        const data = await k8sApi.generateYaml({
          messages: [
            {
              role: 'user',
              content: initialPrompt,
            },
          ],
          enableRAG,
          ragConfig: enableRAG ? { topK: ragTopK } : undefined,
        });

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.content,
          isUser: false,
          timestamp: new Date(),
          yamlBlocks: data.yamlBlocks || [],
        };

        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error('Error generating YAML:', error);

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, I encountered an error generating YAML. Please try again.',
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
  }, [initialPrompt, isTyping, k8sApi, onPromptSent]);

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
      const data = await k8sApi.generateYaml({
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
        enableRAG,
        ragConfig: enableRAG ? { topK: ragTopK } : undefined,
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.content,
        isUser: false,
        timestamp: new Date(),
        yamlBlocks: data.yamlBlocks || [],
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating YAML:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error generating YAML. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Box className={classes.chatContainer}>
      <Box className={classes.messagesContainer}>
        {messages.map(message => (
          <Box key={message.id}>
            <ChatMessage
              message={{
                id: message.id,
                text: message.text,
                isUser: message.isUser,
                timestamp: message.timestamp,
              }}
            />
            {!message.isUser &&
              message.yamlBlocks &&
              message.yamlBlocks.length > 0 && (
                <Box mt={1}>
                  {message.yamlBlocks.map((yaml, index) => {
                    const label =
                      message.yamlBlocks!.length > 1
                        ? `Add YAML Block ${index + 1} to Editor`
                        : 'Add YAML to Editor';
                    return (
                      <Button
                        key={`${message.id}-yaml-${index}`}
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => onYamlAdd(yaml)}
                        className={classes.yamlButton}
                        fullWidth
                      >
                        {label}
                      </Button>
                    );
                  })}
                </Box>
              )}
          </Box>
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </Box>

      <Box className={classes.inputContainer}>
        <TextField
          className={classes.textField}
          variant="outlined"
          placeholder="Ask me to generate Kubernetes YAML..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
          size="small"
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
