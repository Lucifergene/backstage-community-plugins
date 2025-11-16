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
import Typography from '@material-ui/core/Typography';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Paper from '@material-ui/core/Paper';

const useStyles = makeStyles(theme => ({
  panel: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  },
  header: {
    marginBottom: theme.spacing(2),
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
}));

interface GeneralChatPanelProps {
  mcpEnabled: boolean;
  ragEnabled: boolean;
  onToggleMCP: (enabled: boolean) => void;
  onToggleRAG: (enabled: boolean) => void;
}

export const GeneralChatPanel: React.FC<GeneralChatPanelProps> = ({
  mcpEnabled,
  ragEnabled,
  onToggleMCP,
  onToggleRAG,
}) => {
  const classes = useStyles();

  return (
    <Paper className={classes.panel} variant="outlined">
      <Box className={classes.header}>
        <Typography variant="h6" gutterBottom>
          AI Chat Settings
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Configure tools and knowledge base for your chat session
        </Typography>
      </Box>

      <Box className={classes.controls}>
        <FormControlLabel
          control={
            <Switch
              checked={mcpEnabled}
              onChange={e => onToggleMCP(e.target.checked)}
              color="primary"
            />
          }
          label="K8s MCP Server"
        />
        <FormControlLabel
          control={
            <Switch
              checked={ragEnabled}
              onChange={e => onToggleRAG(e.target.checked)}
              color="primary"
            />
          }
          label="RAG (Knowledge Base)"
        />
      </Box>
    </Paper>
  );
};

