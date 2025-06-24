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
import { Box, Typography, Card, CardContent, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import CodeIcon from '@material-ui/icons/Code';
import DatabaseIcon from '@material-ui/icons/Storage';
import HelpIcon from '@material-ui/icons/Help';

const useStyles = makeStyles(theme => ({
  container: {
    padding: theme.spacing(4),
    textAlign: 'center',
    maxWidth: 600,
    margin: '0 auto',
  },
  welcomeTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(2),
    color: theme.palette.text.primary,
  },
  subtitle: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(4),
  },
  suggestionsGrid: {
    marginTop: theme.spacing(3),
  },
  suggestionCard: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid #e0e0e0',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
      backgroundColor: '#f8f9fa',
    },
  },
  suggestionIcon: {
    color: '#4CAF50',
    fontSize: '2rem',
    marginBottom: theme.spacing(1),
  },
  suggestionTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(0.5),
  },
}));

interface QuickStartProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  {
    icon: <SearchIcon />,
    title: 'Web Search',
    description: 'Search the web for information',
    prompt: 'Search for the latest developments in React 18',
  },
  {
    icon: <CodeIcon />,
    title: 'File Operations',
    description: 'Access and manipulate files',
    prompt: 'Show me the contents of package.json',
  },
  {
    icon: <DatabaseIcon />,
    title: 'Kubernetes',
    description: 'Query Kubernetes resources',
    prompt: 'List all pods in the default namespace',
  },
  {
    icon: <HelpIcon />,
    title: 'General Help',
    description: 'Get help with common tasks',
    prompt: 'What can you help me with?',
  },
];

export const QuickStart: React.FC<QuickStartProps> = ({
  onSuggestionClick,
}) => {
  const classes = useStyles();

  return (
    <Box className={classes.container}>
      <Typography variant="h4" className={classes.welcomeTitle}>
        How can I help you today?
      </Typography>
      <Typography variant="body1" className={classes.subtitle}>
        Start a conversation with our AI assistant powered by MCP tools
      </Typography>

      <Grid container spacing={2} className={classes.suggestionsGrid}>
        {suggestions.map((suggestion, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Card
              className={classes.suggestionCard}
              onClick={() => onSuggestionClick(suggestion.prompt)}
            >
              <CardContent>
                <Box className={classes.suggestionIcon}>{suggestion.icon}</Box>
                <Typography variant="h6" className={classes.suggestionTitle}>
                  {suggestion.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {suggestion.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
