import React, { useState, useEffect } from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Chip from '@material-ui/core/Chip';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Tooltip from '@material-ui/core/Tooltip';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import { makeStyles } from '@material-ui/core/styles';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import SearchIcon from '@material-ui/icons/Search';
import DeleteIcon from '@material-ui/icons/Delete';
import RefreshIcon from '@material-ui/icons/Refresh';
import DescriptionIcon from '@material-ui/icons/Description';
import { useApi } from '@backstage/core-plugin-api';
import {
  Progress,
  ResponseErrorPanel,
  StructuredMetadataTable,
  InfoCard,
} from '@backstage/core-components';
import { k8sAiAssistantApiRef } from '../../../api';
import {
  VectorStoreStatusData,
  DocumentInfo,
  FileFormat,
} from '../../../types';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    marginBottom: theme.spacing(3),
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  divider: {
    height: 20,
    borderLeft: `1px solid ${theme.palette.divider}`,
  },
  documentsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(6),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
  },
  documentItem: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(1),
    padding: theme.spacing(2),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  documentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  bulkActionBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1.5, 2),
    backgroundColor: theme.palette.primary.light,
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
}));

// Helper function for file size formatting
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper function for relative time formatting
const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const uploaded = new Date(date);
  const diffMs = now.getTime() - uploaded.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return uploaded.toLocaleDateString();
};

// Helper function for format badge color
const getFormatBadgeColor = (
  format: string,
): 'primary' | 'secondary' | 'default' => {
  switch (format) {
    case FileFormat.YAML:
      return 'primary';
    case FileFormat.PDF:
      return 'secondary';
    case FileFormat.TEXT:
    case FileFormat.MARKDOWN:
      return 'default';
    default:
      return 'default';
  }
};

// Helper function for format label
const getFormatLabel = (format: string): string => {
  switch (format) {
    case FileFormat.YAML:
      return 'YAML';
    case FileFormat.PDF:
      return 'PDF';
    case FileFormat.MARKDOWN:
      return 'Markdown';
    case FileFormat.TEXT:
      return 'Text';
    default:
      return format.toUpperCase();
  }
};

export const KnowledgeBaseTab = () => {
  const classes = useStyles();
  const k8sApi = useApi(k8sAiAssistantApiRef);
  const [config, setConfig] = useState<VectorStoreStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'kind'>(
    'date',
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Upload form state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [maxChunkLength, setMaxChunkLength] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [delimiter, setDelimiter] = useState('\n');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Bulk selection state
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(
    new Set(),
  );
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await k8sApi.getVectorStoreStatus();
        setConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [k8sApi]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setDocumentsLoading(true);
        const response = await k8sApi.listDocuments();
        setDocuments(response.documents);
      } catch (err) {
        console.error('Failed to load documents:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load documents',
        );
      } finally {
        setDocumentsLoading(false);
      }
    };

    // Only fetch documents if config is loaded and configured
    if (config && config.configured) {
      fetchDocuments();
    }
  }, [k8sApi, config]);

  // Refresh handler
  const handleRefresh = async () => {
    try {
      setDocumentsLoading(true);
      setError(null);
      const response = await k8sApi.listDocuments();
      setDocuments(response.documents);
    } catch (err) {
      console.error('Failed to refresh documents:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to refresh documents',
      );
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Sort documents function
  const sortDocuments = (docs: DocumentInfo[]) => {
    return [...docs].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        case 'date':
          comparison =
            new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          comparison = a.totalSize - b.totalSize;
          break;
        case 'kind':
          comparison = (a.kind || '').localeCompare(b.kind || '');
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const supportedFiles = Array.from(files).filter(file => {
        const ext = file.name.toLowerCase().split('.').pop();
        return ['yaml', 'yml', 'pdf', 'txt', 'md'].includes(ext || '');
      });
      setSelectedFiles(supportedFiles);
      setUploadError(null);
      setUploadSuccess(false);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadError('Please select at least one file');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      // Read file contents
      const filesData = await Promise.all(
        selectedFiles.map(async file => {
          const content = await file.text();
          return {
            fileName: file.name,
            content,
          };
        }),
      );

      // Call upload API through API layer
      const result = await k8sApi.uploadDocuments({
        files: filesData,
        chunkSettings: {
          maxChunkLength,
          chunkOverlap,
          delimiter,
        },
      });

      if (result.success) {
        setUploadSuccess(true);
        setSelectedFiles([]);
        // Refresh document list
        await handleRefresh();
        // Close dialog after 1.5 seconds
        setTimeout(() => {
          setUploadDialogOpen(false);
          setUploadSuccess(false);
        }, 1500);
      } else {
        throw new Error(result.error || result.details || 'Upload failed');
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload documents',
      );
    } finally {
      setUploading(false);
    }
  };

  // Reset upload dialog state
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFiles([]);
    setUploadError(null);
    setUploadSuccess(false);
    setMaxChunkLength(1000);
    setChunkOverlap(200);
    setDelimiter('\n');
  };

  // Handle delete document
  const handleDeleteClick = (fileName: string) => {
    setDocumentToDelete(fileName);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await k8sApi.deleteDocument(documentToDelete);
      // Refresh document list
      await handleRefresh();
      // Close dialog
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Failed to delete document',
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
    setDeleteError(null);
  };

  // Bulk selection handlers
  const handleToggleDocument = (fileName: string) => {
    const newSelection = new Set(selectedDocuments);
    if (newSelection.has(fileName)) {
      newSelection.delete(fileName);
    } else {
      newSelection.add(fileName);
    }
    setSelectedDocuments(newSelection);
  };

  const handleToggleAll = () => {
    if (selectedDocuments.size === documents.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(documents.map(d => d.fileName)));
    }
  };

  const handleBulkDeleteClick = () => {
    setBulkDeleteDialogOpen(true);
    setBulkDeleteError(null);
  };

  const handleBulkDeleteConfirm = async () => {
    setBulkDeleting(true);
    setBulkDeleteError(null);

    try {
      // Delete all selected documents
      await Promise.all(
        Array.from(selectedDocuments).map(fileName =>
          k8sApi.deleteDocument(fileName),
        ),
      );
      // Clear selection
      setSelectedDocuments(new Set());
      // Refresh document list
      await handleRefresh();
      // Close dialog
      setBulkDeleteDialogOpen(false);
    } catch (err) {
      setBulkDeleteError(
        err instanceof Error ? err.message : 'Failed to delete documents',
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkDeleteCancel = () => {
    setBulkDeleteDialogOpen(false);
    setBulkDeleteError(null);
  };

  if (loading) {
    return <Progress />;
  }

  if (error && !config) {
    return (
      <Box className={classes.root}>
        <ResponseErrorPanel
          error={new Error(error)}
          title="Failed to load configuration"
        />
        <Box marginTop={2}>
          <Button
            onClick={() => window.location.reload()}
            color="primary"
            variant="contained"
          >
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  if (!config) {
    return null;
  }

  if (!config.configured || !config.vectorStore) {
    return (
      <Box className={classes.root}>
        <Typography variant="h5" gutterBottom>
          Knowledge Base Not Configured
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Vector store is not configured. Please configure a vector store in
          app-config.yaml to enable knowledge base features.
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Required Configuration
            </Typography>
            <Typography
              variant="body2"
              component="pre"
              style={{ overflow: 'auto' }}
            >
              {`k8sAiAssistant:
  provider:
    embeddingModel: gemini-embedding-001
    dimensions: 3072
  vectorStore:
    id: pinecone
    apiKey: \${PINECONE_API_KEY}
    indexName: k8s-knowledge-base`}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const { vectorStore } = config;
  const totalDocuments = documents.length;

  return (
    <Box>
      {/* Configuration Section */}
      <InfoCard title="Configuration">
        <StructuredMetadataTable
          metadata={{
            Status: (
              <Box display="flex" alignItems="center">
                <Chip
                  label={config.summary.healthy ? 'Healthy' : 'Unhealthy'}
                  color={config.summary.healthy ? 'primary' : 'default'}
                  size="small"
                />
              </Box>
            ),
            'Vector Store':
              `${vectorStore.id.charAt(0).toUpperCase() + vectorStore.id.slice(1)} / ${vectorStore.indexName}`,
            'Embedding Model':
              `${vectorStore.embeddingModel} (${vectorStore.embeddingDimensions} dimensions)`,
            'Total Documents': totalDocuments,
          }}
        />
      </InfoCard>

      {/* Documents Section */}
      <Box style={{ marginTop: 32 }}>
        <InfoCard
          title={`Documents (${documents.length})`}
          action={
            <Box style={{ paddingRight: 16, paddingTop: 8 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Upload
              </Button>
            </Box>
          }
        >
      {documents.length > 0 && (
        <Box className={classes.documentsHeader}>
          <Box display="flex" alignItems="center" gap={1}>
            <Checkbox
              checked={
                selectedDocuments.size === documents.length &&
                documents.length > 0
              }
              indeterminate={
                selectedDocuments.size > 0 &&
                selectedDocuments.size < documents.length
              }
              onChange={handleToggleAll}
              color="primary"
            />
            <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
              Documents ({documents.length})
            </Typography>
          </Box>
        <Box className={classes.searchBox}>
          <Select
            value={sortBy}
            onChange={e => {
              const newSortBy = e.target.value as
                | 'name'
                | 'date'
                | 'size'
                | 'kind';
              if (newSortBy === sortBy) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(newSortBy);
                setSortOrder('desc');
              }
            }}
            variant="outlined"
            style={{ minWidth: '150px', marginRight: 8, height: '40px' }}
          >
            <MenuItem value="date">
              Sort by Date{' '}
              {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
            </MenuItem>
            <MenuItem value="name">
              Sort by Name{' '}
              {sortBy === 'name' && (sortOrder === 'desc' ? '↓' : '↑')}
            </MenuItem>
            <MenuItem value="size">
              Sort by Size{' '}
              {sortBy === 'size' && (sortOrder === 'desc' ? '↓' : '↑')}
            </MenuItem>
            <MenuItem value="kind">
              Sort by Kind{' '}
              {sortBy === 'kind' && (sortOrder === 'desc' ? '↓' : '↑')}
            </MenuItem>
          </Select>
          <TextField
            placeholder="Search..."
            size="small"
            variant="outlined"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            style={{ width: '250px' }}
          />
          <Tooltip title="Refresh documents">
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={documentsLoading}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
          </Box>
        )}

        {/* Bulk Action Bar */}
        {selectedDocuments.size > 0 && (
        <Box className={classes.bulkActionBar}>
          <Typography variant="body2" style={{ fontWeight: 600 }}>
            {selectedDocuments.size} document{selectedDocuments.size > 1 ? 's' : ''}{' '}
            selected
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSelectedDocuments(new Set())}
            >
              Clear Selection
            </Button>
            <Button
              size="small"
              variant="contained"
              color="secondary"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDeleteClick}
            >
              Delete Selected
            </Button>
          </Box>
        </Box>
        )}

        {documentsLoading ? (
        <Box textAlign="center" padding={4}>
          <Progress />
          <Typography
            variant="body2"
            color="textSecondary"
            style={{ marginTop: 16 }}
          >
            Loading documents...
          </Typography>
        </Box>
        ) : documents.length === 0 ? (
        <Box className={classes.emptyState}>
          <DescriptionIcon style={{ fontSize: 64, color: '#ccc' }} />
          <Typography variant="h6" gutterBottom style={{ marginTop: 16 }}>
            No Documents Uploaded Yet
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            paragraph
            style={{ maxWidth: 500, margin: '0 auto 16px' }}
          >
            Upload Kubernetes YAML files, PDFs, or text documents to build your
            knowledge base. These will be used to assist with YAML generation
            and provide context for your custom resources.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Your First Document
          </Button>
        </Box>
        ) : (
          <Box>
          {sortDocuments(
            documents.filter(doc => {
              if (!searchQuery) return true;
              const query = searchQuery.toLowerCase();
              return (
                doc.fileName.toLowerCase().includes(query) ||
                doc.format.toLowerCase().includes(query) ||
                doc.kind?.toLowerCase().includes(query) ||
                doc.apiVersion?.toLowerCase().includes(query) ||
                doc.namespace?.toLowerCase().includes(query)
              );
            }),
          ).map((doc: DocumentInfo) => (
            <Box key={doc.fileName} className={classes.documentItem}>
              <Box className={classes.documentInfo}>
                <Checkbox
                  checked={selectedDocuments.has(doc.fileName)}
                  onChange={() => handleToggleDocument(doc.fileName)}
                  color="primary"
                />
                <DescriptionIcon color="action" />
                <Box style={{ flex: 1 }}>
                  <Typography variant="body2" style={{ fontWeight: 500 }}>
                    {doc.fileName}
                  </Typography>
                  <Box
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      flexWrap: 'wrap',
                      marginTop: 4,
                    }}
                  >
                    {/* Format Badge - Always shown */}
                    <Chip
                      label={getFormatLabel(doc.format)}
                      size="small"
                      color={getFormatBadgeColor(doc.format)}
                      style={{ height: 20, fontSize: '0.7rem' }}
                    />

                    {/* Rest of metadata */}
                    <Typography variant="caption" color="textSecondary">
                      {doc.chunkCount} chunk
                      {doc.chunkCount !== 1 ? 's' : ''} •{' '}
                      {formatFileSize(doc.totalSize)} •{' '}
                      {formatRelativeTime(doc.uploadedAt)}
                      {/* PDF-specific */}
                      {doc.pageCount && ` • ${doc.pageCount} pages`}
                      {/* Text-specific */}
                      {doc.lineCount && ` • ${doc.lineCount} lines`}
                      {/* YAML-specific (only in metadata tooltip) */}
                      {doc.kind && doc.apiVersion && (
                        <Tooltip title={`${doc.kind} (${doc.apiVersion})`}>
                          <span> • K8s Resource</span>
                        </Tooltip>
                      )}
                    </Typography>
                  </Box>
                </Box>
                <Tooltip title="Delete document">
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(doc.fileName)}
                    color="secondary"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>
        )}
        </InfoCard>
      </Box>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleCloseUploadDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: 12,
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" style={{ gap: 16 }}>
            <CloudUploadIcon style={{ fontSize: 28, color: '#1976d2' }} />
            <Typography variant="h5" style={{ fontWeight: 600 }}>
              Upload Documents
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {/* Info Card */}
          <Card
            style={{
              marginBottom: 24,
              backgroundColor: '#f5f9ff',
              border: '1px solid #d0e4ff',
            }}
          >
            <CardContent>
              <Typography
                variant="body2"
                style={{ color: '#0d47a1', marginBottom: 8 }}
              >
                Upload Kubernetes YAML files, PDFs, or text documents to build
                your knowledge base. Files will be processed, chunked, embedded,
                and stored in {vectorStore.id}.
              </Typography>
              <Typography variant="caption" style={{ color: '#1565c0' }}>
                📁 Supported formats: YAML (.yaml, .yml), PDF (.pdf), Text
                (.txt, .md)
              </Typography>
            </CardContent>
          </Card>

          {/* File Selection */}
          <Box marginBottom={3}>
            <input
              accept=".yaml,.yml,.pdf,.txt,.md"
              style={{ display: 'none' }}
              id="file-upload"
              multiple
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                fullWidth
                size="large"
                style={{
                  padding: '12px 24px',
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                Select Files (YAML, PDF, TXT)
              </Button>
            </label>
          </Box>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <Card
              style={{
                marginBottom: 24,
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
              }}
            >
              <CardContent>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  style={{ fontWeight: 600, marginBottom: 12 }}
                >
                  Selected Files ({selectedFiles.length})
                </Typography>
                <Box
                  style={{
                    maxHeight: '150px',
                    overflow: 'auto',
                  }}
                >
                  {selectedFiles.map((file, index) => (
                    <Box
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        marginBottom: 4,
                        backgroundColor: '#fff',
                        borderRadius: 4,
                        border: '1px solid #e0e0e0',
                      }}
                    >
                      <DescriptionIcon
                        fontSize="small"
                        style={{ marginRight: 12, color: '#1976d2' }}
                      />
                      <Typography variant="body2" style={{ flex: 1 }}>
                        {file.name}
                      </Typography>
                      <Chip
                        label={formatFileSize(file.size)}
                        size="small"
                        style={{ backgroundColor: '#e3f2fd' }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Chunking Settings */}
          <Box marginBottom={3}>
            <Typography
              variant="subtitle2"
              gutterBottom
              style={{ fontWeight: 600, marginBottom: 16 }}
            >
              Chunking Settings
            </Typography>
            <Box marginBottom={2}>
              <Typography
                variant="body2"
                color="textSecondary"
                style={{ marginBottom: 8, fontWeight: 500 }}
              >
                Maximum Chunk Length
              </Typography>
              <TextField
                type="number"
                value={maxChunkLength}
                onChange={e => setMaxChunkLength(Number(e.target.value))}
                fullWidth
                variant="outlined"
                InputProps={{ inputProps: { min: 100, max: 5000 } }}
              />
            </Box>
            <Box marginBottom={2}>
              <Typography
                variant="body2"
                color="textSecondary"
                style={{ marginBottom: 8, fontWeight: 500 }}
              >
                Chunk Overlap
              </Typography>
              <TextField
                type="number"
                value={chunkOverlap}
                onChange={e => setChunkOverlap(Number(e.target.value))}
                fullWidth
                variant="outlined"
                InputProps={{ inputProps: { min: 0, max: 1000 } }}
              />
            </Box>
            <Box marginBottom={0}>
              <Typography
                variant="body2"
                color="textSecondary"
                style={{ marginBottom: 8, fontWeight: 500 }}
              >
                Delimiter
              </Typography>
              <TextField
                value={delimiter}
                onChange={e => setDelimiter(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="\n"
              />
            </Box>
          </Box>

          {/* Success Message */}
          {uploadSuccess && (
            <Box
              padding={2}
              style={{
                backgroundColor: '#d4edda',
                borderRadius: 8,
                border: '1px solid #c3e6cb',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Typography variant="body2" style={{ color: '#155724', flex: 1 }}>
                ✓ Documents uploaded successfully! Refreshing list...
              </Typography>
            </Box>
          )}

          {/* Error Message */}
          {uploadError && (
            <Box
              padding={2}
              style={{
                backgroundColor: '#f8d7da',
                borderRadius: 8,
                border: '1px solid #f5c6cb',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Typography variant="body2" style={{ color: '#721c24', flex: 1 }}>
                ✗ {uploadError}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button
            onClick={handleCloseUploadDialog}
            disabled={uploading}
            size="large"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            color="primary"
            variant="contained"
            disabled={uploading || selectedFiles.length === 0}
            startIcon={!uploading && <CloudUploadIcon />}
            size="large"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to delete <strong>{documentToDelete}</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            This will remove all {documents.find(d => d.fileName === documentToDelete)?.chunkCount || 0} chunks from the vector store. This action cannot be undone.
          </Typography>

          {/* Error Message */}
          {deleteError && (
            <Box
              marginTop={2}
              padding={2}
              style={{ backgroundColor: '#f8d7da', borderRadius: 4 }}
            >
              <Typography variant="body2" style={{ color: '#721c24' }}>
                ✗ {deleteError}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="secondary"
            variant="contained"
            disabled={deleting}
            startIcon={!deleting && <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={handleBulkDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Multiple Documents</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to delete <strong>{selectedDocuments.size}</strong> document{selectedDocuments.size > 1 ? 's' : ''}?
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            This will remove all chunks from the vector store for these documents:
          </Typography>
          <Box
            maxHeight="200px"
            overflow="auto"
            padding={2}
            style={{
              backgroundColor: '#f5f5f5',
              borderRadius: 4,
              marginBottom: 16,
            }}
          >
            {Array.from(selectedDocuments).map(fileName => (
              <Typography key={fileName} variant="body2" style={{ marginBottom: 4 }}>
                • {fileName}
              </Typography>
            ))}
          </Box>
          <Typography variant="body2" color="error">
            This action cannot be undone.
          </Typography>

          {/* Error Message */}
          {bulkDeleteError && (
            <Box
              marginTop={2}
              padding={2}
              style={{ backgroundColor: '#f8d7da', borderRadius: 4 }}
            >
              <Typography variant="body2" style={{ color: '#721c24' }}>
                ✗ {bulkDeleteError}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBulkDeleteCancel} disabled={bulkDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkDeleteConfirm}
            color="secondary"
            variant="contained"
            disabled={bulkDeleting}
            startIcon={!bulkDeleting && <DeleteIcon />}
          >
            {bulkDeleting ? 'Deleting...' : `Delete ${selectedDocuments.size} Document${selectedDocuments.size > 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
