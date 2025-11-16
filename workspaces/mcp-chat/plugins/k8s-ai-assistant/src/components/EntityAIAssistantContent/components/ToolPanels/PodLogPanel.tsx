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

import React, { useState, useMemo } from 'react';
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
import Paper from '@material-ui/core/Paper';
import { K8sResource } from '../../utils';

const useStyles = makeStyles(theme => ({
  panel: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  },
  section: {
    marginBottom: theme.spacing(2),
  },
}));

interface PodLogPanelProps {
  k8sResources: K8sResource[];
  onAnalyze: (podName: string, namespace: string, logType: string) => void;
}

export const PodLogPanel: React.FC<PodLogPanelProps> = ({
  k8sResources,
  onAnalyze,
}) => {
  const classes = useStyles();
  const [selectedPod, setSelectedPod] = useState('');
  const [logType, setLogType] = useState('stdout');

  const availablePods = useMemo(() => {
    return k8sResources
      .filter(r => r.kind === 'Pod')
      .map(r => ({
        name: r.name,
        namespace: r.namespace,
      }));
  }, [k8sResources]);

  const handlePodChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedPod(event.target.value as string);
  };

  const handleLogTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLogType(event.target.value);
  };

  const handleAnalyzeClick = () => {
    if (!selectedPod) return;

    const pod = availablePods.find(p => p.name === selectedPod);
    if (pod) {
      onAnalyze(selectedPod, pod.namespace, logType);
    }
  };

  return (
    <Paper className={classes.panel} variant="outlined">
      <Typography variant="h6" gutterBottom>
        Pod Log Analysis
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Select a Pod to analyze its logs using AI
      </Typography>

      <Box className={classes.section}>
        <FormControl
          fullWidth
          variant="outlined"
          size="small"
          disabled={availablePods.length === 0}
        >
          <InputLabel>Pod</InputLabel>
          <Select value={selectedPod} onChange={handlePodChange} label="Pod">
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {availablePods.map(pod => (
              <MenuItem key={pod.name} value={pod.name}>
                {pod.name}
                <Typography
                  variant="caption"
                  color="textSecondary"
                  style={{ marginLeft: '8px' }}
                >
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
          <RadioGroup
            row
            value={logType}
            onChange={handleLogTypeChange}
          >
            <FormControlLabel
              value="stdout"
              control={<Radio size="small" />}
              label="stdout"
            />
            <FormControlLabel
              value="stderr"
              control={<Radio size="small" />}
              label="stderr"
            />
            <FormControlLabel
              value="both"
              control={<Radio size="small" />}
              label="Both"
            />
          </RadioGroup>
        </FormControl>
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handleAnalyzeClick}
        disabled={!selectedPod}
        fullWidth
      >
        Analyze Logs
      </Button>
    </Paper>
  );
};

