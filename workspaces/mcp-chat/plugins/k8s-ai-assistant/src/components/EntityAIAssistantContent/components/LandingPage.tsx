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
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  LinearProgress,
  makeStyles,
  IconButton,
} from '@material-ui/core';
import StorageIcon from '@material-ui/icons/Storage';
import SettingsIcon from '@material-ui/icons/Settings';
import DescriptionIcon from '@material-ui/icons/Description';
import CloudIcon from '@material-ui/icons/Cloud';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import CloseIcon from '@material-ui/icons/Close';
import { useApi } from '@backstage/core-plugin-api';
import {
  InfoCard,
  TabbedLayout,
  StructuredMetadataTable,
} from '@backstage/core-components';
import { k8sAiAssistantApiRef } from '../../../api';
import { ProviderStatus } from './ProviderStatus';
import { VectorStoreStatus } from './VectorStoreStatus';
import { McpServerStatus } from './McpServerStatus';
import { ExplainLogsTab } from './ExplainLogsTab';
import { GenerateYamlTab } from './GenerateYamlTab';
import { AiAssistantChatTab } from './AiAssistantChatTab';
import { KnowledgeBaseTab } from './KnowledgeBaseTab';
import { UnifiedChatLayout } from './UnifiedChatLayout';
import { K8sResource } from '../utils';
import {
  ProviderStatusData,
  VectorStoreStatusData,
  MCPServerStatusData,
  ToolsResponse,
  ListDocumentsResponse,
} from '../../../types';

const useStyles = makeStyles(theme => ({
  statCard: {
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
    border: `1px solid ${theme.palette.divider}`,
    textAlign: 'center',
    minHeight: 80,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(0.5),
  },
  statLabel: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
  },
}));


interface LandingPageProps {
  k8sResources: K8sResource[];
}

export const LandingPage = ({ k8sResources }: LandingPageProps) => {
  const k8sApi = useApi(k8sAiAssistantApiRef);
  const classes = useStyles();

  // State for provider status
  const [providerData, setProviderData] = useState<ProviderStatusData | null>(
    null,
  );
  const [providerLoading, setProviderLoading] = useState(true);
  const [providerError, setProviderError] = useState<string | null>(null);

  // State for vector store status
  const [vectorStoreData, setVectorStoreData] =
    useState<VectorStoreStatusData | null>(null);
  const [vectorStoreLoading, setVectorStoreLoading] = useState(true);
  const [vectorStoreError, setVectorStoreError] = useState<string | null>(null);

  // State for MCP server status
  const [mcpServerData, setMcpServerData] =
    useState<MCPServerStatusData | null>(null);
  const [mcpToolsData, setMcpToolsData] = useState<ToolsResponse | null>(null);
  const [mcpLoading, setMcpLoading] = useState(true);
  const [mcpError, setMcpError] = useState<string | null>(null);

  // State for Knowledge Base drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [documentsData, setDocumentsData] =
    useState<ListDocumentsResponse | null>(null);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  
  // State for fullscreen chat
  const [isChatFullscreen, setIsChatFullscreen] = useState(false);

  useEffect(() => {
    // Helper function to check if error is 503 (service still initializing)
    const isServiceUnavailable = (err: any): boolean => {
      return err?.message?.includes('503') || 
             err?.response?.status === 503 ||
             err?.message?.includes('Service has not started up yet') ||
             err?.message?.includes('Service Unavailable');
    };

    // Helper function to retry with exponential backoff
    const retryWithBackoff = async <T,>(
      fetchFn: () => Promise<T>,
      maxRetries: number = 5,
      initialDelay: number = 1000,
    ): Promise<T> => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await fetchFn();
        } catch (err) {
          // If it's a 503 and not the last attempt, retry
          if (isServiceUnavailable(err) && attempt < maxRetries - 1) {
            const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          // Otherwise, throw the error
          throw err;
        }
      }
      throw new Error('Max retries exceeded');
    };

    // Fetch provider status with retry
    const fetchProviderStatus = async () => {
      try {
        const data = await retryWithBackoff(() => k8sApi.getProviderStatus());
        setProviderData(data);
        setProviderError(null);
      } catch (err) {
        setProviderError(
          err instanceof Error ? err.message : 'Failed to load provider status',
        );
      } finally {
        setProviderLoading(false);
      }
    };

    // Fetch vector store status with retry
    const fetchVectorStoreStatus = async () => {
      try {
        const data = await retryWithBackoff(() => k8sApi.getVectorStoreStatus());
        setVectorStoreData(data);
        setVectorStoreError(null);
      } catch (err) {
        setVectorStoreError(
          err instanceof Error
            ? err.message
            : 'Failed to load vector store status',
        );
      } finally {
        setVectorStoreLoading(false);
      }
    };

    // Fetch MCP server status and tools with retry
    const fetchMcpStatus = async () => {
      try {
        const [serverData, toolsData] = await retryWithBackoff(() =>
          Promise.all([
            k8sApi.getMCPServerStatus(),
            k8sApi.getAvailableTools(),
          ]),
        );
        setMcpServerData(serverData);
        setMcpToolsData(toolsData);
        setMcpError(null);
      } catch (err) {
        setMcpError(
          err instanceof Error ? err.message : 'Failed to load MCP status',
        );
      } finally {
        setMcpLoading(false);
      }
    };

    // Fetch documents for Knowledge Base summary with retry
    const fetchDocuments = async () => {
      try {
        const data = await retryWithBackoff(() => k8sApi.listDocuments());
        setDocumentsData(data);
      } catch (err) {
        // Silently fail - KB might not be configured
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchProviderStatus();
    fetchVectorStoreStatus();
    fetchMcpStatus();
    fetchDocuments();
  }, [k8sApi]);

  return (
    <Grid container spacing={3}>
      {/* System Status Section - Hidden in fullscreen */}
      {!isChatFullscreen && (
        <>
          <Grid item xs={12} md={4}>
            <ProviderStatus
              data={providerData}
              loading={providerLoading}
              error={providerError}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <VectorStoreStatus
              data={vectorStoreData}
              loading={vectorStoreLoading}
              error={vectorStoreError}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <McpServerStatus
              serverData={mcpServerData}
              toolsData={mcpToolsData}
              loading={mcpLoading}
              error={mcpError}
            />
          </Grid>

          {/* Knowledge Base Summary Section */}
          <Grid item xs={12}>
            <Box
              style={{
                backgroundColor: '#fff',
                padding: '16px 24px',
                borderRadius: 4,
                border: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                Kubernetes Knowledge Base
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SettingsIcon />}
                onClick={() => setIsDrawerOpen(true)}
                disabled={!vectorStoreData?.configured}
              >
                Manage
              </Button>
            </Box>
          </Grid>
        </>
      )}

      {/* Unified AI Chat Interface */}
      <Grid item xs={12}>
        <Box>
          <UnifiedChatLayout 
            k8sResources={k8sResources}
            onFullscreenChange={setIsChatFullscreen}
          />
        </Box>
      </Grid>

      {/* Knowledge Base Drawer */}
      {isDrawerOpen && (
        <Box
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '65%',
            maxWidth: 900,
            backgroundColor: '#f5f5f5',
            boxShadow: '-4px 0 12px rgba(0,0,0,0.2)',
            zIndex: 1300,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Box
            style={{
              position: 'sticky',
              top: 0,
              backgroundColor: '#fff',
              borderBottom: '2px solid #e0e0e0',
              padding: '20px 32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            <Box display="flex" alignItems="center" style={{ gap: 16 }}>
              <StorageIcon style={{ fontSize: 28, color: '#1976d2' }} />
              <Typography variant="h4" style={{ fontWeight: 600 }}>
                Knowledge Base
              </Typography>
            </Box>
            <IconButton
              onClick={() => setIsDrawerOpen(false)}
              size="small"
              style={{
                backgroundColor: '#f5f5f5',
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Content */}
          <Box style={{ padding: '24px 32px', flex: 1 }}>
            <KnowledgeBaseTab />
          </Box>
        </Box>
      )}

      {/* Backdrop for drawer */}
      {isDrawerOpen && (
        <Box
          onClick={() => setIsDrawerOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1200,
          }}
        />
      )}
    </Grid>
  );
};

