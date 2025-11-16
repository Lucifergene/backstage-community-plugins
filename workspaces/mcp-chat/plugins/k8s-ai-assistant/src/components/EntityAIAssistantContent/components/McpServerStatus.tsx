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
import Tooltip from '@material-ui/core/Tooltip';
import Chip from '@material-ui/core/Chip';
import CircularProgress from '@material-ui/core/CircularProgress';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import SettingsInputComponentIcon from '@material-ui/icons/SettingsInputComponent';
import { MCPServerStatusData, ToolsResponse } from '../../../types';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(1),
    height: '100%',
  },
  errorBorder: {
    border: `2px solid ${theme.palette.error.main}`,
  },
  successBorder: {
    border: `2px solid ${theme.palette.success.main}`,
  },
  warningBorder: {
    border: `2px solid ${theme.palette.warning.main}`,
  },
  defaultBorder: {
    border: `1px solid ${theme.palette.divider}`,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  titleBox: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  details: {
    color: theme.palette.text.primary,
    lineHeight: 1.5,
    fontSize: '0.8rem',
  },
}));

interface McpServerStatusProps {
  serverData: MCPServerStatusData | null;
  toolsData: ToolsResponse | null;
  loading: boolean;
  error: string | null;
}

export const McpServerStatus = ({
  serverData,
  toolsData,
  loading,
  error,
}: McpServerStatusProps) => {
  const classes = useStyles();

  const total = serverData?.total ?? 0;
  const active = serverData?.active ?? 0;
  const toolCount = toolsData?.toolCount ?? 0;
  const hasActiveServers = active > 0;
  const isError = error && !loading;

  const getBorderClass = () => {
    if (isError) return classes.errorBorder;
    if (hasActiveServers) return classes.successBorder;
    if (total > 0) return classes.warningBorder;
    return classes.defaultBorder;
  };

  const getStatusText = () => {
    if (loading) return 'Loading...';
    if (isError) return 'Error';
    if (hasActiveServers) return `${active} Active`;
    if (total > 0) return 'Inactive';
    return 'None';
  };

  const getDotColor = () => {
    if (loading) return 'default';
    if (isError) return 'error';
    if (hasActiveServers) return 'success';
    if (total > 0) return 'warning';
    return 'default';
  };

  const getTooltipTitle = () => {
    if (loading) return 'Loading MCP server status...';
    if (isError) return `Error loading MCP servers: ${error}`;
    if (hasActiveServers) {
      return `${active} of ${total} MCP servers are active with ${toolCount} tools available.`;
    }
    if (total > 0) {
      return `${total} MCP servers configured but none are active.`;
    }
    return 'No MCP servers configured.';
  };

  const displayServers = loading
    ? 'Loading...'
    : `${active}/${total} servers`;

  const displayTools = loading ? 'Loading...' : `${toolCount} tools`;

  const serverList = serverData?.servers
    ?.filter(s => s.status.connected)
    .map(s => s.name)
    .join(', ');

  return (
    <Box className={`${classes.root} ${getBorderClass()}`}>
      <Box className={classes.header}>
        <Box className={classes.titleBox}>
          <SettingsInputComponentIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" style={{ fontWeight: 600 }}>
            MCP Servers
          </Typography>
        </Box>
        {loading ? (
          <CircularProgress size={20} />
        ) : (
          <Tooltip title={getTooltipTitle()} placement="left">
            <Chip
              label={getStatusText()}
              size="small"
              color={hasActiveServers ? 'primary' : 'default'}
              icon={
                <FiberManualRecordIcon
                  style={{ fontSize: 10 }}
                  color={getDotColor()}
                />
              }
              style={{ cursor: 'help' }}
            />
          </Tooltip>
        )}
      </Box>
      <Typography variant="caption" className={classes.details}>
        <strong>Status:</strong> {displayServers}
        <br />
        <strong>Tools:</strong> {displayTools}
        {serverList && (
          <>
            <br />
            <strong>Active:</strong> {serverList}
          </>
        )}
      </Typography>
    </Box>
  );
};

