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
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import { ToolDefinition } from '../../../types';

const useStyles = makeStyles(theme => ({
  sidebar: {
    width: 140,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    overflowY: 'auto',
    backgroundColor: 'transparent',
  },
  toolCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2),
    cursor: 'pointer',
    borderRadius: theme.shape.borderRadius * 2,
    backgroundColor: theme.palette.background.paper,
    border: `2px solid ${theme.palette.divider}`,
    transition: 'all 0.2s ease',
    boxShadow: theme.shadows[1],
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[3],
      borderColor: theme.palette.primary.light,
    },
  },
  toolCardActive: {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.selected,
    boxShadow: theme.shadows[2],
  },
  toolIcon: {
    fontSize: '2rem',
    marginBottom: theme.spacing(0.5),
  },
  toolName: {
    fontSize: '0.75rem',
    textAlign: 'center',
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
}));

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    id: 'pod-logs',
    name: 'Pod Logs',
    icon: '📋',
    description: 'Analyze Kubernetes pod logs',
  },
  {
    id: 'yaml-gen',
    name: 'YAML Gen',
    icon: '🔨',
    description: 'Generate Kubernetes YAML manifests',
  },
];

interface ToolSidebarProps {
  activeTool: string | null;
  onToolSelect: (toolId: string) => void;
}

export const ToolSidebar: React.FC<ToolSidebarProps> = ({
  activeTool,
  onToolSelect,
}) => {
  const classes = useStyles();

  return (
    <Box className={classes.sidebar}>
      {TOOL_REGISTRY.map(tool => (
        <Tooltip key={tool.id} title={tool.description} placement="left">
          <Box
            className={`${classes.toolCard} ${
              activeTool === tool.id ? classes.toolCardActive : ''
            }`}
            onClick={() => onToolSelect(tool.id)}
          >
            <Box className={classes.toolIcon}>{tool.icon}</Box>
            <Typography className={classes.toolName}>{tool.name}</Typography>
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
};

