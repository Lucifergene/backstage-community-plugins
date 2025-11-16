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
import React, { useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';
import { K8sResource } from '../utils';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
}));

interface ResourceSummaryProps {
  resources: K8sResource[];
}

export const ResourceSummary = ({ resources }: ResourceSummaryProps) => {
  const classes = useStyles();

  const summary = useMemo(() => {
    const kindCounts: Record<string, number> = {};
    resources.forEach(resource => {
      kindCounts[resource.kind] = (kindCounts[resource.kind] || 0) + 1;
    });
    return kindCounts;
  }, [resources]);

  const totalCount = resources.length;

  if (totalCount === 0) {
    return (
      <Box className={classes.root}>
        <Typography variant="body2" color="textSecondary">
          No Kubernetes resources detected for this entity
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={classes.root}>
      <Typography variant="body2" style={{ fontWeight: 500 }}>
        Detected Resources: {totalCount} total
      </Typography>
      <Box className={classes.chipContainer}>
        {Object.entries(summary).map(([kind, count]) => (
          <Chip
            key={kind}
            label={`${count} ${kind}${count > 1 ? 's' : ''}`}
            size="small"
            variant="outlined"
          />
        ))}
      </Box>
    </Box>
  );
};

