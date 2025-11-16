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
import CloudIcon from '@material-ui/icons/Cloud';
import { ProviderStatusData } from '../../../types';

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
  errorBox: {
    marginTop: theme.spacing(1.5),
    padding: theme.spacing(1.25),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.spacing(0.75),
    border: `1px solid ${theme.palette.error.main}`,
    maxHeight: 80,
    overflowY: 'auto',
  },
  errorText: {
    color: theme.palette.text.primary,
    fontSize: '0.75rem',
    lineHeight: 1.4,
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },
}));

interface ProviderStatusProps {
  data: ProviderStatusData | null;
  loading: boolean;
  error: string | null;
}

export const ProviderStatus = ({
  data,
  loading,
  error,
}: ProviderStatusProps) => {
  const classes = useStyles();

  const primaryProvider = data?.providers?.[0];
  const connectionInfo = primaryProvider?.connection;
  const isConnected = connectionInfo?.connected ?? false;
  const isError = !isConnected && !loading;

  const getBorderClass = () => {
    if (isError) return classes.errorBorder;
    if (isConnected) return classes.successBorder;
    return classes.defaultBorder;
  };

  const getStatusText = () => {
    if (loading) return 'Testing...';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  const getDotColor = () => {
    if (loading) return 'warning';
    if (isConnected) return 'success';
    return 'error';
  };

  const getTooltipTitle = () => {
    if (loading) return 'Testing provider connection...';
    if (isConnected) {
      const modelsText = connectionInfo?.models
        ? `${connectionInfo.models.length} models available.`
        : '';
      return `Successfully connected. ${modelsText}`;
    }
    return `Connection failed: ${connectionInfo?.error || error || 'Unknown error'}`;
  };

  const displayModel = loading
    ? 'Loading...'
    : error && !data
      ? 'Error'
      : primaryProvider?.model || 'Not available';

  const displayUrl = loading
    ? 'Loading...'
    : error && !data
      ? 'Error'
      : primaryProvider?.baseUrl || 'Not specified';

  const errorMessage = connectionInfo?.error || error;

  return (
    <Box className={`${classes.root} ${getBorderClass()}`}>
      <Box className={classes.header}>
        <Box className={classes.titleBox}>
          <CloudIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" style={{ fontWeight: 600 }}>
            Provider
          </Typography>
        </Box>
        {loading ? (
          <CircularProgress size={20} />
        ) : (
          <Tooltip title={getTooltipTitle()} placement="left">
            <Chip
              label={getStatusText()}
              size="small"
              color={isConnected ? 'primary' : 'default'}
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
        <strong>Model:</strong> {displayModel}
        <br />
        <strong>URL:</strong> {displayUrl}
      </Typography>
      {errorMessage && !loading && (
        <Box className={classes.errorBox}>
          <Typography variant="caption" className={classes.errorText}>
            <strong>Error:</strong> {errorMessage}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

