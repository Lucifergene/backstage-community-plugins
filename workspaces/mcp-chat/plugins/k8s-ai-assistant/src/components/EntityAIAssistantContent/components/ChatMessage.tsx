import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Collapse from '@material-ui/core/Collapse';
import Chip from '@material-ui/core/Chip';
import PersonIcon from '@material-ui/icons/Person';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import CodeIcon from '@material-ui/icons/Code';
import EditIcon from '@material-ui/icons/Edit';
import ReactMarkdown from 'react-markdown';
import { BotIcon } from './BotIcon';

const useStyles = makeStyles(theme => ({
  messageContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  avatar: {
    width: 32,
    height: 32,
    fontSize: '1rem',
    marginTop: theme.spacing(0.25),
  },
  userAvatar: {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
  },
  botAvatar: {
    backgroundColor: 'transparent',
    color: theme.palette.text.secondary,
  },
  userCard: {
    maxWidth: '100%',
    backgroundColor: 'transparent',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    boxShadow: 'none',
  },
  botCard: {
    maxWidth: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
  },
  markdown: {
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(1),
      fontWeight: 600,
    },
    '& h1': { fontSize: '1.5rem' },
    '& h2': { fontSize: '1.3rem' },
    '& h3': { fontSize: '1.1rem' },
    '& p': {
      margin: theme.spacing(0.5, 0),
      lineHeight: 1.6,
    },
    '& ul, & ol': {
      margin: theme.spacing(0.5, 0),
      paddingLeft: theme.spacing(3),
    },
    '& li': {
      margin: theme.spacing(0.25, 0),
    },
    '& blockquote': {
      borderLeft: `4px solid ${theme.palette.primary.main}`,
      paddingLeft: theme.spacing(2),
      margin: theme.spacing(1, 0),
      fontStyle: 'italic',
      backgroundColor: theme.palette.background.default,
      padding: theme.spacing(1, 1, 1, 2),
      borderRadius: theme.spacing(0.5),
    },
    '& code': {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.primary,
      padding: '2px 4px',
      borderRadius: '3px',
      fontFamily: 'monospace',
      fontSize: '0.875em',
    },
    '& pre': {
      backgroundColor: theme.palette.background.default,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.spacing(0.5),
      padding: theme.spacing(1.5),
      fontFamily: 'monospace',
      fontSize: '0.875rem',
      margin: theme.spacing(1, 0),
      overflow: 'auto',
      position: 'relative',
      '& code': {
        backgroundColor: 'transparent',
        padding: 0,
        color: theme.palette.text.primary,
      },
    },
    '& table': {
      borderCollapse: 'collapse',
      width: '100%',
      margin: theme.spacing(1, 0),
    },
    '& th, & td': {
      border: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(0.5, 1),
      textAlign: 'left',
    },
    '& th': {
      backgroundColor: theme.palette.action.hover,
      fontWeight: 600,
    },
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    '& hr': {
      border: 'none',
      borderTop: `1px solid ${theme.palette.divider}`,
      margin: theme.spacing(2, 0),
    },
  },
  codeBlock: {
    position: 'relative',
  },
  copyButton: {
    position: 'absolute',
    top: theme.spacing(0.5),
    right: theme.spacing(0.5),
    padding: theme.spacing(0.5),
    minWidth: 'auto',
    backgroundColor: theme.palette.action.hover,
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  },
  sourcesContainer: {
    marginTop: theme.spacing(2.5),
    borderRadius: theme.spacing(1.5),
    border: `1px solid ${theme.palette.divider}`,
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  sourcesHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1.5, 2),
    backgroundColor: theme.palette.action.hover,
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  },
  sourcesHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
  sectionBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.5, 1.5),
    borderRadius: theme.spacing(3),
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  sourceChip: {
    marginRight: theme.spacing(0.5),
  },
  sourceCard: {
    marginTop: theme.spacing(1),
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.background.default,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    maxWidth: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
    '& pre': {
      margin: 0,
      padding: theme.spacing(1),
      backgroundColor: theme.palette.action.hover,
      borderRadius: theme.spacing(0.5),
      overflow: 'auto',
      fontSize: '0.85rem',
      maxHeight: '200px',
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap',
    },
  },
  sourcesContent: {
    padding: theme.spacing(2),
    maxWidth: '100%',
    overflow: 'hidden',
  },
  toolsContainer: {
    marginTop: theme.spacing(2.5),
    borderRadius: theme.spacing(1.5),
    border: `1px solid ${theme.palette.divider}`,
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  toolHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1.5, 2),
    backgroundColor: theme.palette.action.hover,
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  },
  toolHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
  toolChipsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
    maxWidth: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  toolChip: {
    height: 28,
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[2],
    },
  },
  toolResponse: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.divider}`,
    maxWidth: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  toolResponseTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: theme.spacing(1.5),
    color: theme.palette.text.primary,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  toolResponseContent: {
    fontSize: '0.85rem',
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '400px',
    overflow: 'auto',
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    lineHeight: 1.5,
  },
}));

interface ChatMessageProps {
  message: {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    ragDocuments?: string[];
    ragEnabled?: boolean;
    toolsUsed?: string[];
    toolResponses?: any[];
    yamlBlocks?: string[];
  };
  onOpenYamlEditor?: (yaml: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onOpenYamlEditor }) => {
  const classes = useStyles();
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const getToolResponseForTool = (toolName: string) => {
    if (!message.toolResponses) {
      return 'No tool responses available';
    }

    const toolResponse = message.toolResponses.find(
      response => response.name === toolName,
    );

    if (!toolResponse) {
      return `No response data found for tool: ${toolName}`;
    }

    // Extract content from the result object
    const result = toolResponse.result;

    if (!result) {
      return 'No result data';
    }

    // Handle MCP tool response format with content array
    if (result.content && Array.isArray(result.content)) {
      return result.content
        .map((block: any) => {
          if (block.type === 'text') return block.text;
          if (typeof block === 'string') return block;
          return JSON.stringify(block, null, 2);
        })
        .join('\n');
    }

    // Handle string content
    if (result.content && typeof result.content === 'string') {
      return result.content;
    }

    // Fallback: return stringified result
    if (typeof result === 'string') {
      return result;
    }

    return JSON.stringify(result, null, 2);
  };

  const handleCopyCode = async (text: string) => {
    try {
      await window.navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const CodeBlock = ({ children, ...props }: any) => {
    const codeText = children?.props?.children || '';
    return (
      <Box className={classes.codeBlock}>
        <pre {...props}>{children}</pre>
        <IconButton
          size="small"
          onClick={() => handleCopyCode(codeText)}
          title={copiedText === codeText ? 'Copied!' : 'Copy code'}
          className={classes.copyButton}
        >
          <FileCopyIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  const formatMessage = (text: string) => {
    if (!text || !text.trim()) {
      return (
        <Typography
          variant="body1"
          style={{
            fontSize: '0.95rem',
            lineHeight: message.isUser ? 1.5 : 1.6,
            fontWeight: message.isUser ? 500 : 'normal',
          }}
        >
          {text}
        </Typography>
      );
    }

    const hasMarkdown =
      /[#*_`\[\]]/g.test(text) ||
      text.includes('```') ||
      text.includes('\n') ||
      text.includes('|') ||
      text.includes('> ');

    if (hasMarkdown && !message.isUser) {
      return (
        <Box className={classes.markdown}>
          <ReactMarkdown
            components={{
              pre: CodeBlock,
            }}
          >
            {text}
          </ReactMarkdown>
        </Box>
      );
    }

    return (
      <Typography
        variant="body1"
        style={{
          fontSize: '0.95rem',
          lineHeight: message.isUser ? 1.5 : 1.6,
          fontWeight: message.isUser ? 500 : 'normal',
        }}
      >
        {text}
      </Typography>
    );
  };

  return (
    <Box className={classes.messageContainer}>
      <Avatar
        className={`${classes.avatar} ${
          message.isUser ? classes.userAvatar : classes.botAvatar
        }`}
      >
        {message.isUser ? <PersonIcon /> : <BotIcon size={30} color="#666" />}
      </Avatar>

      <Box>
        <Card className={message.isUser ? classes.userCard : classes.botCard}>
          <Box
            sx={{
              padding: message.isUser ? 4 : 0,
            }}
          >
            {formatMessage(message.text)}
          </Box>
        </Card>

        {/* YAML Editor Button - Show below YAML blocks */}
        {!message.isUser && message.yamlBlocks && message.yamlBlocks.length > 0 && onOpenYamlEditor && (
          <Box sx={{ marginTop: 2, width: '100%' }}>
            {message.yamlBlocks.map((yaml, index) => (
              <Button
                key={index}
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<EditIcon />}
                onClick={() => onOpenYamlEditor(yaml)}
                style={{
                  marginTop: index > 0 ? 8 : 0,
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                Edit YAML in Editor
              </Button>
            ))}
          </Box>
        )}

        {/* RAG Sources Section */}
        {!message.isUser && message.ragEnabled && (
          <Box className={classes.sourcesContainer}>
            {message.ragDocuments && message.ragDocuments.length > 0 ? (
              <>
                <Box
                  className={classes.sourcesHeader}
                  onClick={() => setSourcesExpanded(!sourcesExpanded)}
                >
                  <Box className={classes.sourcesHeaderLeft}>
                    <MenuBookIcon fontSize="small" color="primary" />
                    <Typography variant="body2" style={{ fontWeight: 600 }}>
                      Knowledge Base
                    </Typography>
                    <Box
                      className={classes.sectionBadge}
                      style={{
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                        color: '#1976d2',
                      }}
                    >
                      {message.ragDocuments.length}{' '}
                      {message.ragDocuments.length === 1 ? 'doc' : 'docs'}
                    </Box>
                  </Box>
                  {sourcesExpanded ? (
                    <ExpandLessIcon fontSize="small" color="action" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" color="action" />
                  )}
                </Box>

                <Collapse in={sourcesExpanded}>
                  <Box className={classes.sourcesContent}>
                    {message.ragDocuments.map((doc, index) => (
                      <Box key={index} className={classes.sourceCard}>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          style={{
                            fontWeight: 600,
                            display: 'block',
                            marginBottom: 8,
                          }}
                        >
                          Document {index + 1}
                        </Typography>
                        <pre>
                          {doc.length > 500
                            ? `${doc.substring(0, 500)}...`
                            : doc}
                        </pre>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </>
            ) : (
              <Box
                className={classes.sourcesHeader}
                style={{ cursor: 'default' }}
              >
                <Box className={classes.sourcesHeaderLeft}>
                  <MenuBookIcon fontSize="small" color="disabled" />
                  <Typography variant="body2" color="textSecondary">
                    No relevant documents found
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* MCP Tools Section */}
        {!message.isUser &&
          message.toolsUsed &&
          message.toolsUsed.length > 0 && (
            <Box className={classes.toolsContainer}>
              <Box
                className={classes.toolHeader}
                onClick={() => setToolsExpanded(!toolsExpanded)}
                style={{ cursor: 'pointer' }}
              >
                <Box className={classes.toolHeaderLeft}>
                  <CodeIcon fontSize="small" style={{ color: '#f57c00' }} />
                  <Typography variant="body2" style={{ fontWeight: 600 }}>
                    MCP Tools
                  </Typography>
                  <Box
                    className={classes.sectionBadge}
                    style={{
                      backgroundColor: 'rgba(245, 124, 0, 0.1)',
                      color: '#f57c00',
                    }}
                  >
                    {message.toolsUsed.length}{' '}
                    {message.toolsUsed.length === 1 ? 'tool' : 'tools'}
                  </Box>
                </Box>
                {toolsExpanded ? (
                  <ExpandLessIcon fontSize="small" color="action" />
                ) : (
                  <ExpandMoreIcon fontSize="small" color="action" />
                )}
              </Box>

              <Collapse in={toolsExpanded}>
                {/* Tool Chips Section */}
                <Box className={classes.toolChipsContainer}>
                  {message.toolsUsed.map(tool => (
                    <Chip
                      key={tool}
                      label={tool}
                      size="small"
                      clickable
                      onClick={() =>
                        setSelectedTool(selectedTool === tool ? null : tool)
                      }
                      icon={<CodeIcon fontSize="small" />}
                      className={classes.toolChip}
                      color={selectedTool === tool ? 'primary' : 'default'}
                      variant={selectedTool === tool ? 'default' : 'outlined'}
                    />
                  ))}
                </Box>

                {/* Tool Responses - Use Collapse for each tool */}
                {message.toolsUsed.map(tool => (
                  <Collapse key={`collapse-${tool}`} in={selectedTool === tool}>
                    <Box className={classes.toolResponse}>
                      <Typography className={classes.toolResponseTitle}>
                        <CodeIcon fontSize="small" style={{ marginRight: 4 }} />
                        {tool}
                      </Typography>
                      <Typography className={classes.toolResponseContent}>
                        {getToolResponseForTool(tool)}
                      </Typography>
                    </Box>
                  </Collapse>
                ))}
              </Collapse>
            </Box>
          )}
      </Box>
    </Box>
  );
};
