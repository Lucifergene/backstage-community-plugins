import React, { useState, useMemo } from 'react';
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
import { LogsChat } from './LogsChat';

interface ExplainLogsTabProps {
  k8sResources: K8sResource[];
}

export const ExplainLogsTab = ({ k8sResources }: ExplainLogsTabProps) => {
  const [selectedPod, setSelectedPod] = useState('');
  const [logType, setLogType] = useState('stdout');
  const [shouldStartChat, setShouldStartChat] = useState(false);

  // Get available Pods only (since MCP server only supports pods_log)
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
    setLogType((event.target as HTMLInputElement).value);
  };

  const handleExplainLogsClick = () => {
    setShouldStartChat(true);
  };

  return (
    <Box display="flex" height="100%">
      <Box flex={1} p={2} borderRight="1px solid #ccc">
        <Typography variant="h6" gutterBottom>
          Pod Log Analysis
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Select a Pod to analyze its logs using AI
        </Typography>

        <Typography
          variant="subtitle1"
          gutterBottom
          style={{ marginTop: '24px' }}
        >
          Select Pod
        </Typography>
        <FormControl
          fullWidth
          variant="outlined"
          size="small"
          style={{ marginBottom: '16px' }}
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
          <Typography variant="body2" color="error" paragraph>
            No Pods found in this cluster
          </Typography>
        )}

        <Typography
          variant="subtitle1"
          gutterBottom
          style={{ marginTop: '24px' }}
        >
          Log Type
        </Typography>
        <FormControl component="fieldset" style={{ marginBottom: '24px' }}>
          <RadioGroup
            row
            aria-label="log-type"
            name="log-type"
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

        <Button
          variant="contained"
          color="primary"
          onClick={handleExplainLogsClick}
          disabled={!selectedPod}
          fullWidth
        >
          Analyze Logs
        </Button>
      </Box>
      <Box flex={1} p={2}>
        {selectedPod ? (
          <LogsChat
            selectedResourceType="Pod"
            specificResource={selectedPod}
            logType={logType}
            k8sResources={k8sResources}
            initialPrompt={
              shouldStartChat ? 'Show me any errors in the logs' : undefined
            }
            onPromptSent={() => setShouldStartChat(false)}
          />
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100%"
          >
            <Typography variant="body2" color="textSecondary">
              Select a Pod to start analyzing its logs
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
