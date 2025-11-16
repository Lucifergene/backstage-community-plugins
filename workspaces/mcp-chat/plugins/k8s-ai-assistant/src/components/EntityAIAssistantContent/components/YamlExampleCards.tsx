import React, { useState, useEffect } from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import DescriptionIcon from '@material-ui/icons/Description';
import StorageIcon from '@material-ui/icons/Storage';
import CloudQueueIcon from '@material-ui/icons/CloudQueue';
import SettingsIcon from '@material-ui/icons/Settings';
import LockIcon from '@material-ui/icons/Lock';
import RouterIcon from '@material-ui/icons/Router';
import DnsIcon from '@material-ui/icons/Dns';
import { useApi } from '@backstage/core-plugin-api';
import { Progress } from '@backstage/core-components';
import { k8sAiAssistantApiRef } from '../../../api';
import { DocumentInfo } from '../../../types';

const useStyles = makeStyles(theme => ({
  listContainer: {
    padding: theme.spacing(1, 2, 2, 2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1, 1.5),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      borderColor: theme.palette.primary.main,
      transform: 'translateX(4px)',
    },
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: theme.spacing(0.5),
    backgroundColor: theme.palette.action.hover,
    flexShrink: 0,
  },
  icon: {
    fontSize: 18,
    color: theme.palette.primary.main,
  },
  contentArea: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  fileName: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  metadataRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    flexWrap: 'wrap',
  },
  badge: {
    fontSize: '0.65rem',
    height: 18,
    padding: theme.spacing(0, 1),
    borderRadius: theme.spacing(0.5),
  },
  kindBadge: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    fontWeight: 500,
  },
  versionBadge: {
    backgroundColor: theme.palette.action.selected,
    color: theme.palette.text.secondary,
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(4, 2),
    color: theme.palette.text.secondary,
  },
}));

interface YamlExampleCardsProps {
  onExampleSelect: (fileName: string, kind?: string) => void;
}

const getIconForKind = (kind?: string) => {
  if (!kind) return DescriptionIcon;
  
  const kindLower = kind.toLowerCase();
  if (kindLower.includes('deployment')) return StorageIcon;
  if (kindLower.includes('service')) return CloudQueueIcon;
  if (kindLower.includes('configmap')) return SettingsIcon;
  if (kindLower.includes('secret')) return LockIcon;
  if (kindLower.includes('ingress')) return RouterIcon;
  if (kindLower.includes('statefulset')) return DnsIcon;
  
  return DescriptionIcon;
};

export const YamlExampleCards: React.FC<YamlExampleCardsProps> = ({
  onExampleSelect,
}) => {
  const classes = useStyles();
  const k8sApi = useApi(k8sAiAssistantApiRef);
  const [yamlDocs, setYamlDocs] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchYamlDocs = async () => {
      try {
        setLoading(true);
        const response = await k8sApi.listYamlDocuments();
        setYamlDocs(response.documents || []);
      } catch (err) {
        console.error('Failed to load YAML documents:', err);
        setError('Failed to load YAML examples');
      } finally {
        setLoading(false);
      }
    };

    fetchYamlDocs();
  }, [k8sApi]);

  if (loading) {
    return (
      <Box textAlign="center" padding={4}>
        <Progress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={classes.emptyState}>
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (yamlDocs.length === 0) {
    return (
      <Box className={classes.emptyState}>
        <DescriptionIcon style={{ fontSize: 48, opacity: 0.3 }} />
        <Typography variant="body2" style={{ marginTop: 16 }}>
          No YAML examples uploaded yet
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Upload YAML files in the Knowledge Base tab
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Typography
        variant="subtitle2"
        style={{ paddingLeft: 16, paddingTop: 8, paddingBottom: 4, fontWeight: 600 }}
      >
        Your YAML Examples ({yamlDocs.length})
      </Typography>
      <Box className={classes.listContainer}>
        {yamlDocs.map((doc, index) => {
          const IconComponent = getIconForKind(doc.kind);
          const displayName = doc.fileName.replace(/\.(yaml|yml)$/i, '');
          
          return (
            <Box
              key={index}
              className={classes.listItem}
              onClick={() => onExampleSelect(doc.fileName, doc.kind)}
            >
              <Box className={classes.iconContainer}>
                <IconComponent className={classes.icon} />
              </Box>
              
              <Box className={classes.contentArea}>
                <Typography className={classes.fileName}>
                  {displayName}
                </Typography>
                <Box className={classes.metadataRow}>
                  {doc.kind && (
                    <Box className={`${classes.badge} ${classes.kindBadge}`}>
                      {doc.kind}
                    </Box>
                  )}
                  {doc.apiVersion && (
                    <Box className={`${classes.badge} ${classes.versionBadge}`}>
                      {doc.apiVersion}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </>
  );
};

