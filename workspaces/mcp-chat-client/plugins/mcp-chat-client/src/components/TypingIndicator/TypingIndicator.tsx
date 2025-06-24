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
import { Box, Avatar, Card, CardContent, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import BotIcon from '@material-ui/icons/Android';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  avatar: {
    width: 32,
    height: 32,
    fontSize: '1rem',
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    border: '0px solid #fff',
    maxWidth: '70%',
  },
  content: {
    padding: `${theme.spacing(1.5)}px ${theme.spacing(2)}px !important`,
  },
  dots: {
    display: 'flex',
    gap: theme.spacing(0.5),
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#999',
    animation: '$typing 1.4s infinite',
    '&:nth-child(2)': {
      animationDelay: '0.2s',
    },
    '&:nth-child(3)': {
      animationDelay: '0.4s',
    },
  },
  '@keyframes typing': {
    '0%, 60%, 100%': {
      transform: 'translateY(0)',
      opacity: 0.5,
    },
    '30%': {
      transform: 'translateY(-10px)',
      opacity: 1,
    },
  },
}));

export const TypingIndicator: React.FC = () => {
  const classes = useStyles();

  return (
    <Box className={classes.container}>
      <Avatar className={classes.avatar}>
        <BotIcon />
      </Avatar>
      <Card className={classes.card} elevation={0}>
        <CardContent className={classes.content}>
          <Box className={classes.dots}>
            <Box className={classes.dot} />
            <Box className={classes.dot} />
            <Box className={classes.dot} />
            <Typography
              variant="caption"
              style={{ marginLeft: 8, color: '#666' }}
            >
              Hang on...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
