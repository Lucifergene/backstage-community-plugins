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
import React, { useState, useRef, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  Checkbox,
  FormControlLabel,
} from '@material-ui/core';
import {
  makeStyles,
  createTheme,
  ThemeProvider,
} from '@material-ui/core/styles';
import SendIcon from '@material-ui/icons/Send';
import AddIcon from '@material-ui/icons/Add';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import SettingsIcon from '@material-ui/icons/Settings';
import MemoryIcon from '@material-ui/icons/Memory';
import { Page, Content } from '@backstage/core-components';
import { ChatMessage } from '../ChatMessage';
import { TypingIndicator } from '../TypingIndicator';
import { QuickStart } from '../QuickStart';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  topBar: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    flexShrink: 0,
  },
  contentArea: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chatContainerWithSidebar: {
    marginRight: 400,
    transition: 'margin-right 0.3s ease',
  },
  chatContainerWithCollapsedSidebar: {
    marginRight: 60,
    transition: 'margin-right 0.3s ease',
  },
  sidebar: {
    width: 400,
    backgroundColor: '#ffffff',
    borderLeft: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
  },
  sidebarCollapsed: {
    width: 60,
  },
  sidebarHeader: {
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  sidebarHeaderCollapsed: {
    padding: theme.spacing(1),
    justifyContent: 'center',
  },
  collapseButton: {
    position: 'absolute',
    top: theme.spacing(1),
    left: -20,
    backgroundColor: '#ffffff',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '50%',
    width: 40,
    height: 40,
    zIndex: 2,
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  newChatButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    '&:hover': {
      backgroundColor: '#45a049',
    },
    borderRadius: theme.spacing(1),
    textTransform: 'none',
    padding: theme.spacing(1, 2),
  },
  mcpServers: {
    padding: theme.spacing(1, 2),
    flex: 1,
  },
  serverItem: {
    marginBottom: theme.spacing(1),
    '& .MuiListItemIcon-root': {
      minWidth: 36,
    },
  },
  activeServer: {
    backgroundColor: theme.palette.action.selected,
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing(6),
    paddingBottom: theme.spacing(10), // Add padding to account for fixed input
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  inputContainer: {
    marginLeft: '14rem',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 400, // Account for sidebar width
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    backgroundColor: '#ffffff',
    zIndex: 1000,
    transition: 'right 0.3s ease',
  },
  inputContainerCollapsed: {
    right: 60, // Account for collapsed sidebar width
  },
  messageInput: {
    marginLeft: theme.spacing(5),
    marginRight: theme.spacing(5),
    flex: 1,
    '& .MuiOutlinedInput-root': {
      borderRadius: theme.spacing(3),
      backgroundColor: '#f8f8f8',
    },
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    '&:hover': {
      backgroundColor: '#45a049',
    },
    '&:disabled': {
      backgroundColor: '#ccc',
    },
  },
  activeTools: {
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  toolChip: {
    margin: theme.spacing(0.5),
    backgroundColor: '#e8f5e8',
    color: '#4CAF50',
  },
}));

const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50',
    },
  },
});

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  tools?: string[];
}

interface MCPServer {
  name: string;
  enabled: boolean;
}

export const ChatPage = () => {
  const classes = useStyles();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedServer, setSelectedServer] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const mcpServers: MCPServer[] = [
    {
      name: 'Brave Search',
      enabled: true,
    },
    {
      name: 'File Server',
      enabled: true,
    },
    {
      name: 'Kubernetes Server',
      enabled: true,
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: suggestion,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);

    // Simulate bot response with typing indicator
    setTimeout(() => {
      setIsTyping(false);
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm an AI assistant powered by MCP tools. I can help you search the web, access files, and interact with Kubernetes clusters. What would you like to know?",
        isUser: false,
        timestamp: new Date(),
        tools: ['Brave Search'],
      };
      setMessages(prev => [...prev, botResponse]);
    }, 2000);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputValue,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      setInputValue('');
      setIsTyping(true);

      // Simulate bot response with typing indicator
      setTimeout(() => {
        setIsTyping(false);
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "I'm an AI assistant powered by MCP tools. I can help you search the web, access files, and interact with Kubernetes clusters. What would you like to know?",
          isUser: false,
          timestamp: new Date(),
          tools: ['Brave Search'],
        };
        setMessages(prev => [...prev, botResponse]);
      }, 2000);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleServerToggle = (serverName: string) => {
    // Toggle server enabled state
    // eslint-disable-next-line no-console
    console.log(`Toggle ${serverName}`);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <ThemeProvider theme={theme}>
      <Page themeId="tool">
        <Content noPadding>
          <Box className={classes.root}>
            {/* Top Bar - Full Width */}
            {/* <Box className={classes.topBar}>
              <Typography variant="h5" style={{ fontWeight: 600 }}>
                How can I help you today?
              </Typography>
              <IconButton
                onClick={handleMenuClick}
                style={{ marginLeft: 'auto' }}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleMenuClose}>
                  <SettingsIcon style={{ marginRight: 8 }} />
                  Settings
                </MenuItem>
              </Menu>
            </Box> */}
            {/* <Header
              title="How can I help you today?"
              subtitle="Start a conversation with our AI assistant powered by MCP tools"
            /> */}

            {/* Content Area */}
            <Box className={classes.contentArea}>
              {/* Chat Container */}
              <Box
                className={`${classes.chatContainer} ${
                  sidebarCollapsed
                    ? classes.chatContainerWithCollapsedSidebar
                    : classes.chatContainerWithSidebar
                }`}
                style={{
                  marginTop: messages.length === 0 ? '16rem' : '0rem',
                }}
              >
                {messages.length === 0 ? (
                  <QuickStart onSuggestionClick={handleSuggestionClick} />
                ) : (
                  <Box
                    className={classes.messagesContainer}
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    {messages.map(message => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </Box>
                )}

                <Box
                  className={`${classes.inputContainer} ${
                    sidebarCollapsed ? classes.inputContainerCollapsed : ''
                  }`}
                >
                  <TextField
                    className={classes.messageInput}
                    placeholder="Message Assistant..."
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

              {/* Sidebar - Right Side */}
              <Box
                className={`${classes.sidebar} ${
                  sidebarCollapsed ? classes.sidebarCollapsed : ''
                }`}
              >
                {!sidebarCollapsed && (
                  <IconButton
                    className={classes.collapseButton}
                    onClick={toggleSidebar}
                    size="small"
                  >
                    <ChevronRightIcon />
                  </IconButton>
                )}

                <Box
                  className={`${classes.sidebarHeader} ${
                    sidebarCollapsed ? classes.sidebarHeaderCollapsed : ''
                  }`}
                >
                  {!sidebarCollapsed && (
                    <>
                      <Typography variant="h6" style={{ fontWeight: 600 }}>
                        MCP Chat Client
                      </Typography>
                    </>
                  )}
                  {sidebarCollapsed && (
                    <Box
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <IconButton size="small" onClick={toggleSidebar}>
                        <ChevronLeftIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {!sidebarCollapsed && (
                  <>
                    <Box style={{ padding: '16px 16px 8px' }}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        className={classes.newChatButton}
                        size="small"
                        fullWidth
                      >
                        New chat
                      </Button>
                    </Box>

                    <Box
                      style={{
                        padding: '16px',
                        margin: '16px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                      }}
                    >
                      <Box
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          style={{ fontWeight: 600 }}
                        >
                          ● OpenAI
                        </Typography>
                        <Typography
                          variant="caption"
                          style={{ color: '#4CAF50', fontWeight: 500 }}
                        >
                          Connected
                        </Typography>
                      </Box>
                      <Typography variant="caption" style={{ color: '#666' }}>
                        Model: gpt-4o-mini
                        <br />
                        URL: https://api.openai.com/v1
                      </Typography>
                    </Box>

                    <Box className={classes.mcpServers}>
                      <Box
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: 12,
                          paddingBottom: 8,
                          borderBottom: '1px solid #e9ecef',
                        }}
                      >
                        <MemoryIcon
                          style={{
                            marginRight: '8px',
                            color: '#4CAF50',
                            fontSize: '1.1rem',
                          }}
                        />
                        <Typography
                          variant="subtitle2"
                          style={{
                            fontWeight: 600,
                            color: '#333',
                            fontSize: '1rem',
                          }}
                        >
                          MCP Servers
                        </Typography>
                      </Box>
                      <List dense>
                        {mcpServers.map(server => (
                          <ListItem
                            key={server.name}
                            className={`${classes.serverItem} ${
                              selectedServer === server.name
                                ? classes.activeServer
                                : ''
                            }`}
                            button
                            onClick={() => setSelectedServer(server.name)}
                          >
                            <ListItemIcon>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={server.enabled}
                                    onChange={() =>
                                      handleServerToggle(server.name)
                                    }
                                    size="small"
                                    style={{ color: '#4CAF50' }}
                                  />
                                }
                                label=""
                              />
                            </ListItemIcon>

                            <ListItemText
                              primary={server.name}
                              primaryTypographyProps={{ variant: 'body1' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>

                    <Box className={classes.activeTools}>
                      <Typography variant="caption" style={{ color: '#666' }}>
                        Active Tools
                      </Typography>
                      <Box style={{ marginTop: 8 }}>
                        <Chip
                          label="Brave Search"
                          size="small"
                          className={classes.toolChip}
                        />
                        <Chip
                          label="File Server"
                          size="small"
                          className={classes.toolChip}
                        />
                        <Chip
                          label="Kubernetes Server"
                          size="small"
                          className={classes.toolChip}
                        />
                      </Box>
                    </Box>
                  </>
                )}

                {sidebarCollapsed && (
                  <Box style={{ padding: '16px 8px' }}>
                    {/* Add button when collapsed */}
                    <Box
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '16px',
                      }}
                    >
                      <IconButton size="small">
                        <AddIcon />
                      </IconButton>
                    </Box>

                    {/* OpenAI Section Icon */}
                    <Box
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '16px',
                      }}
                    >
                      <IconButton size="small" title="OpenAI Configuration">
                        <SettingsIcon />
                      </IconButton>
                    </Box>

                    {/* MCP Servers Section Icon */}
                    <Box
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '16px',
                      }}
                    >
                      <IconButton size="small" title="MCP Servers">
                        <MemoryIcon />
                      </IconButton>
                    </Box>

                    <List dense>
                      {mcpServers.map(server => (
                        <ListItem
                          key={server.name}
                          button
                          style={{
                            padding: '8px',
                            justifyContent: 'center',
                            marginBottom: '8px',
                          }}
                          onClick={() => setSelectedServer(server.name)}
                        />
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Content>
      </Page>
    </ThemeProvider>
  );
};
