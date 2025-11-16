import React, { useState, useEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Alert from '@material-ui/lab/Alert';
import SendIcon from '@material-ui/icons/Send';
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
  },
}));

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  ragDocuments?: string[];
  ragEnabled?: boolean;
  toolsUsed?: string[];
  toolResponses?: any[];
}

interface GeneralChatProps {
  enableMCPTools: boolean;
  enableRAG: boolean;
}

export const GeneralChat: React.FC<GeneralChatProps> = ({
  enableMCPTools,
  enableRAG,
}) => {
  const ragTopK = 3; // Default to 3 documents
  const classes = useStyles();
  const k8sApi = useApi(k8sAiAssistantApiRef);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasDocuments, setHasDocuments] = useState<boolean | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check vector store status on mount
  useEffect(() => {
    const checkVectorStore = async () => {
      try {
        const status = await k8sApi.getVectorStoreStatus();
        const docCount =
          status.vectorStore?.connection?.totalDocuments ?? 0;
        setHasDocuments(docCount > 0);
      } catch (error) {
        console.error('Error checking vector store status:', error);
        setHasDocuments(false);
      }
    };

    if (enableRAG) {
      checkVectorStore();
    }
  }, [enableRAG, k8sApi]);

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
      // Call backend API
      const data = await k8sApi.sendChatMessage({
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
        enableMCPTools,
        enableRAG,
        ragConfig: enableRAG ? { topK: ragTopK } : undefined,
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.content,
        isUser: false,
        timestamp: new Date(),
        ragDocuments: data.ragContext,
        ragEnabled: enableRAG,
        toolsUsed: data.toolsUsed,
        toolResponses: data.toolResponses,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling chat API:', error);

      let errorText =
        'Sorry, I encountered an error processing your message. Please try again.';
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
      {/* RAG warning when enabled but no documents */}
      {enableRAG && hasDocuments === false && (
        <Alert severity="warning" style={{ margin: 8 }}>
          <strong>RAG is enabled but no documents found.</strong> Upload
          documents in the Knowledge Base tab to enable context-aware responses.
        </Alert>
      )}

      <Box className={classes.messagesContainer}>
        {messages.length === 0 ? (
          <Box className={classes.emptyState}>
            <Typography variant="h6" gutterBottom>
              Welcome to Kubernetes AI Assistant
            </Typography>
            <Typography variant="body2">
              Ask me anything about Kubernetes, troubleshooting, best practices,
              or your cluster resources.
            </Typography>
            <Typography variant="caption" style={{ marginTop: 16 }}>
              {enableMCPTools && '🔧 K8s MCP Tools enabled'}
              {enableMCPTools && enableRAG && ' • '}
              {enableRAG && hasDocuments === true &&
                '📚 RAG enabled - Context from uploaded documents'}
              {enableRAG && hasDocuments === false &&
                '⚠️ RAG enabled but no documents uploaded'}
              {!enableMCPTools && !enableRAG &&
                'Enable MCP Tools or RAG for enhanced capabilities'}
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
          placeholder="Ask about Kubernetes..."
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

