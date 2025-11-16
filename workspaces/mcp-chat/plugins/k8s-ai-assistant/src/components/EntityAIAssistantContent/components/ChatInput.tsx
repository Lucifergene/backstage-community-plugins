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

import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import SendIcon from '@material-ui/icons/Send';

const useStyles = makeStyles(theme => ({
  container: {
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
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

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type your message...',
}) => {
  const classes = useStyles();
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim() || disabled) return;
    onSend(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Box className={classes.container}>
      <TextField
        className={classes.textField}
        placeholder={placeholder}
        variant="outlined"
        multiline
        maxRows={4}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        size="small"
        disabled={disabled}
      />
      <IconButton
        className={classes.sendButton}
        onClick={handleSend}
        disabled={!inputValue.trim() || disabled}
      >
        <SendIcon />
      </IconButton>
    </Box>
  );
};

