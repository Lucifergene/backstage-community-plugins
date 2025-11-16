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
import Paper from '@material-ui/core/Paper';
import { YamlQuickPrompts } from '../YamlQuickPrompts';

const useStyles = makeStyles(theme => ({
  panel: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  },
  header: {
    marginBottom: theme.spacing(2),
  },
}));

interface YamlGeneratorPanelProps {
  enableRAG: boolean;
  onPromptSelect: (prompt: string) => void;
}

export const YamlGeneratorPanel: React.FC<YamlGeneratorPanelProps> = ({
  enableRAG,
  onPromptSelect,
}) => {
  const classes = useStyles();

  return (
    <Paper className={classes.panel} variant="outlined">
      <Box className={classes.header}>
        <Typography variant="h6" gutterBottom>
          YAML Generator
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {enableRAG
            ? 'Generating with YAML examples from your knowledge base'
            : 'Describe the Kubernetes resource you need'}
        </Typography>
      </Box>

      <YamlQuickPrompts
        onPromptSelect={onPromptSelect}
        showExamples={enableRAG}
      />
    </Paper>
  );
};

