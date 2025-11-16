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
import Divider from '@material-ui/core/Divider';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    margin: theme.spacing(2, 0),
  },
  divider: {
    flex: 1,
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.5, 1.5),
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.text.secondary,
  },
  icon: {
    fontSize: '1rem',
  },
  text: {
    fontSize: '0.875rem',
    fontWeight: 500,
  },
}));

interface ToolSeparatorProps {
  toolName: string;
  toolIcon: string;
}

export const ToolSeparator: React.FC<ToolSeparatorProps> = ({
  toolName,
  toolIcon,
}) => {
  const classes = useStyles();

  return (
    <Box className={classes.container}>
      <Divider className={classes.divider} />
      <Box className={classes.content}>
        <span className={classes.icon}>{toolIcon}</span>
        <Typography className={classes.text}>
          Switched to {toolName}
        </Typography>
      </Box>
      <Divider className={classes.divider} />
    </Box>
  );
};

