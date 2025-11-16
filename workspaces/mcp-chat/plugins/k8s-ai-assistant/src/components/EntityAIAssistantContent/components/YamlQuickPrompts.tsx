import React from 'react';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import { makeStyles } from '@material-ui/core/styles';
import StorageIcon from '@material-ui/icons/Storage';
import CloudQueueIcon from '@material-ui/icons/CloudQueue';
import SettingsIcon from '@material-ui/icons/Settings';
import LockIcon from '@material-ui/icons/Lock';
import RouterIcon from '@material-ui/icons/Router';
import DnsIcon from '@material-ui/icons/Dns';
import { YamlExampleCards } from './YamlExampleCards';

const useStyles = makeStyles(theme => ({
  compactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: theme.spacing(1),
    padding: theme.spacing(2, 2, 1, 2),
    maxWidth: '100%',
    overflow: 'hidden',
  },
  compactButton: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 1.5),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
    minWidth: 0,
    overflow: 'hidden',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      borderColor: theme.palette.primary.main,
      transform: 'translateY(-1px)',
    },
  },
  compactIcon: {
    fontSize: 18,
    color: theme.palette.primary.main,
    flexShrink: 0,
  },
  compactLabel: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: theme.palette.text.primary,
    textAlign: 'left',
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
  },
  card: {
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    border: `1px solid ${theme.palette.divider}`,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
      borderColor: theme.palette.primary.main,
    },
  },
  cardContent: {
    padding: theme.spacing(2),
    '&:last-child': {
      paddingBottom: theme.spacing(2),
    },
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.action.hover,
    marginBottom: theme.spacing(1.5),
  },
  icon: {
    fontSize: 24,
    color: theme.palette.primary.main,
  },
  title: {
    fontWeight: 600,
    marginBottom: theme.spacing(0.5),
  },
  description: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    lineHeight: 1.4,
  },
}));

interface YamlQuickPromptsProps {
  onPromptSelect: (prompt: string) => void;
  showExamples?: boolean;
}

const QUICK_PROMPTS = [
  {
    title: 'Deployment',
    description: 'Web app with replicas',
    prompt:
      'Generate a Deployment manifest for a web application with 3 replicas',
    icon: StorageIcon,
  },
  {
    title: 'Service',
    description: 'LoadBalancer service',
    prompt: 'Generate a LoadBalancer Service manifest exposing port 80',
    icon: CloudQueueIcon,
  },
  {
    title: 'ConfigMap',
    description: 'App configuration',
    prompt: 'Generate a ConfigMap with application configuration',
    icon: SettingsIcon,
  },
  {
    title: 'Secret',
    description: 'Database credentials',
    prompt: 'Generate a Secret for database credentials',
    icon: LockIcon,
  },
  {
    title: 'Ingress',
    description: 'HTTP traffic routing',
    prompt: 'Generate an Ingress manifest for routing HTTP traffic',
    icon: RouterIcon,
  },
  {
    title: 'StatefulSet',
    description: 'Persistent storage',
    prompt: 'Generate a StatefulSet for a database with persistent storage',
    icon: DnsIcon,
  },
];

export const YamlQuickPrompts: React.FC<YamlQuickPromptsProps> = ({
  onPromptSelect,
  showExamples = false,
}) => {
  const classes = useStyles();

  const handleExampleSelect = (fileName: string, kind?: string) => {
    const prompt = kind
      ? `Generate a ${kind} manifest similar to ${fileName}`
      : `Generate a Kubernetes manifest similar to ${fileName}`;
    onPromptSelect(prompt);
  };

  return (
    <>
      {/* Quick Start Templates - Compact Design */}
      <Typography
        variant="subtitle2"
        style={{ paddingLeft: 16, paddingTop: 8, paddingBottom: 4, fontWeight: 600 }}
      >
        Quick Start Templates
      </Typography>
      <Box className={classes.compactGrid}>
        {QUICK_PROMPTS.map((prompt, index) => {
          const IconComponent = prompt.icon;
          return (
            <Box
              key={index}
              className={classes.compactButton}
              onClick={() => onPromptSelect(prompt.prompt)}
            >
              <IconComponent className={classes.compactIcon} />
              <Typography className={classes.compactLabel}>
                {prompt.title}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* YAML Examples from Knowledge Base - Only show when RAG is enabled */}
      {showExamples && (
        <>
          <Box px={2} py={2}>
            <Divider />
          </Box>
          <YamlExampleCards onExampleSelect={handleExampleSelect} />
        </>
      )}
    </>
  );
};
