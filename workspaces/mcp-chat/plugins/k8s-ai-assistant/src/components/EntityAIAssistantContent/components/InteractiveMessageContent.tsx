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

import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import Button from '@material-ui/core/Button';
import { K8sResource } from '../utils';
import { YamlQuickPrompts } from './YamlQuickPrompts';

const useStyles = makeStyles(theme => ({
  interactiveContainer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
  },
  section: {
    marginBottom: theme.spacing(2),
  },
}));

interface InteractiveMessageContentProps {
  type: 'pod-selector' | 'yaml-mode-selector' | 'chat-settings';
  data: any;
  onAction: (action: string, payload: any) => void;
}

export const InteractiveMessageContent: React.FC<InteractiveMessageContentProps> = ({
  type,
  data,
  onAction,
}) => {
  const classes = useStyles();

  if (type === 'pod-selector') {
    return <PodSelectorContent data={data} onAction={onAction} classes={classes} />;
  }

  if (type === 'yaml-mode-selector') {
    return <YamlModeSelectorContent data={data} onAction={onAction} classes={classes} />;
  }

  if (type === 'chat-settings') {
    return <ChatSettingsContent data={data} onAction={onAction} classes={classes} />;
  }

  return null;
};

// Pod Selector Component
const PodSelectorContent: React.FC<{
  data: { k8sResources: K8sResource[] };
  onAction: (action: string, payload: any) => void;
  classes: any;
}> = ({ data, onAction, classes }) => {
  const [selectedPod, setSelectedPod] = useState('');
  const [logType, setLogType] = useState('stdout');

  const availablePods = data.k8sResources
    .filter((r: K8sResource) => r.kind === 'Pod')
    .map((r: K8sResource) => ({
      name: r.name,
      namespace: r.namespace,
    }));

  const handleAnalyze = () => {
    const pod = availablePods.find(p => p.name === selectedPod);
    if (pod) {
      onAction('analyze-logs', {
        podName: selectedPod,
        namespace: pod.namespace,
        logType,
      });
    }
  };

  return (
    <Box className={classes.interactiveContainer}>
      <Box className={classes.section}>
        <FormControl fullWidth variant="outlined" size="small" disabled={availablePods.length === 0}>
          <InputLabel>Select Pod</InputLabel>
          <Select value={selectedPod} onChange={e => setSelectedPod(e.target.value as string)} label="Select Pod">
            <MenuItem value="">
              <em>Choose a pod...</em>
            </MenuItem>
            {availablePods.map((pod: any) => (
              <MenuItem key={pod.name} value={pod.name}>
                {pod.name}
                <Typography variant="caption" color="textSecondary" style={{ marginLeft: 8 }}>
                  ({pod.namespace})
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {availablePods.length === 0 && (
          <Typography variant="body2" color="error" style={{ marginTop: 8 }}>
            No Pods found in this cluster
          </Typography>
        )}
      </Box>

      <Box className={classes.section}>
        <Typography variant="subtitle2" gutterBottom>
          Log Type
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup row value={logType} onChange={e => setLogType(e.target.value)}>
            <FormControlLabel value="stdout" control={<Radio size="small" />} label="stdout" />
            <FormControlLabel value="stderr" control={<Radio size="small" />} label="stderr" />
            <FormControlLabel value="both" control={<Radio size="small" />} label="Both" />
          </RadioGroup>
        </FormControl>
      </Box>

      <Button variant="contained" color="primary" onClick={handleAnalyze} disabled={!selectedPod} fullWidth>
        Analyze Logs
      </Button>
    </Box>
  );
};

// YAML Mode Selector Component
const YamlModeSelectorContent: React.FC<{
  data: { enableRAG: boolean };
  onAction: (action: string, payload: any) => void;
  classes: any;
}> = ({ data, onAction, classes }) => {
  const handlePromptSelect = (prompt: string) => {
    onAction('generate-yaml', { prompt });
  };

  return (
    <Box className={classes.interactiveContainer}>
      <Box className={classes.section}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {data.enableRAG
            ? 'Generating with YAML examples from your knowledge base'
            : 'Choose a template or describe what you need'}
        </Typography>
      </Box>

      <YamlQuickPrompts onPromptSelect={handlePromptSelect} showExamples={data.enableRAG} />
    </Box>
  );
};

// Chat Settings Component
const ChatSettingsContent: React.FC<{
  data: { mcpEnabled: boolean; ragEnabled: boolean };
  onAction: (action: string, payload: any) => void;
  classes: any;
}> = ({ data, onAction, classes }) => {
  const [mcpEnabled, setMcpEnabled] = useState(data.mcpEnabled);
  const [ragEnabled, setRagEnabled] = useState(data.ragEnabled);

  const handleToggleMCP = (checked: boolean) => {
    setMcpEnabled(checked);
    onAction('toggle-mcp', { mcpEnabled: checked });
  };

  const handleToggleRAG = (checked: boolean) => {
    setRagEnabled(checked);
    onAction('toggle-rag', { ragEnabled: checked });
  };

  return (
    <Box className={classes.interactiveContainer}>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Configure tools and knowledge base for your chat session
      </Typography>

      <Box display="flex" flexDirection="column" gap={1} mt={2}>
        <FormControlLabel
          control={
            <Switch checked={mcpEnabled} onChange={e => handleToggleMCP(e.target.checked)} color="primary" />
          }
          label="K8s MCP Server"
        />
        <FormControlLabel
          control={
            <Switch checked={ragEnabled} onChange={e => handleToggleRAG(e.target.checked)} color="primary" />
          }
          label="RAG (Knowledge Base)"
        />
      </Box>
    </Box>
  );
};

