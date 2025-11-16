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
import StorageIcon from '@material-ui/icons/Storage';
import { VectorStoreStatusData } from '../../../types';

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

interface VectorStoreStatusProps {
  data: VectorStoreStatusData | null;
  loading: boolean;
  error: string | null;
}

export const VectorStoreStatus = ({
  data,
  loading,
  error,
}: VectorStoreStatusProps) => {
  const classes = useStyles();

  const configured = data?.configured ?? false;
  const vectorStore = data?.vectorStore;
  const isConnected = vectorStore?.connection?.connected ?? false;
  const isHealthy = data?.summary?.healthy ?? false;
  const isError = (error || data?.summary?.error) && !loading;

  const getBorderClass = () => {
    if (isError) return classes.errorBorder;
    if (!configured) return classes.warningBorder;
    if (isConnected && isHealthy) return classes.successBorder;
    return classes.defaultBorder;
  };

  const getStatusText = () => {
    if (loading) return 'Loading...';
    if (!configured) return 'Not Configured';
    if (isConnected && isHealthy) return 'Healthy';
    if (isError) return 'Error';
    return 'Unknown';
  };

  const getDotColor = () => {
    if (loading) return 'default';
    if (!configured) return 'warning';
    if (isConnected && isHealthy) return 'success';
    return 'error';
  };

  const getTooltipTitle = () => {
    if (loading) return 'Loading vector store status...';
    if (!configured)
      return 'Vector store not configured. Knowledge base features unavailable.';
    if (isConnected && isHealthy) {
      const chunksText = vectorStore?.connection?.totalDocuments
        ? `${vectorStore.connection.totalDocuments} chunks indexed.`
        : 'No chunks indexed yet.';
      return `Vector store connected. ${chunksText}`;
    }
    return `Error: ${data?.summary?.error || vectorStore?.connection?.error || error || 'Unknown error'}`;
  };

  const displayEmbedding = loading
    ? 'Loading...'
    : !configured
      ? 'Not configured'
      : vectorStore?.embeddingModel
        ? `${vectorStore.embeddingModel} (${vectorStore.embeddingDimensions}d)`
        : 'Not available';

  const displayIndex = loading
    ? 'Loading...'
    : !configured
      ? 'Not configured'
      : vectorStore?.indexName
        ? `${vectorStore.id}/${vectorStore.indexName}`
        : 'Not available';

  const displayDocuments = loading
    ? 'Loading...'
    : !configured
      ? '0'
      : vectorStore?.connection?.totalDocuments?.toString() || '0';

  const errorMessage = data?.summary?.error || vectorStore?.connection?.error || error;

  return (
    <Box className={`${classes.root} ${getBorderClass()}`}>
      <Box className={classes.header}>
        <Box className={classes.titleBox}>
          <StorageIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" style={{ fontWeight: 600 }}>
            Vector Store
          </Typography>
        </Box>
        {loading ? (
          <CircularProgress size={20} />
        ) : (
          <Tooltip title={getTooltipTitle()} placement="left">
            <Chip
              label={getStatusText()}
              size="small"
              color={
                isConnected && isHealthy && configured ? 'primary' : 'default'
              }
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
        <strong>Embedding:</strong> {displayEmbedding}
        <br />
        <strong>Index:</strong> {displayIndex}
        <br />
        <strong>Chunks:</strong> {displayDocuments}
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

