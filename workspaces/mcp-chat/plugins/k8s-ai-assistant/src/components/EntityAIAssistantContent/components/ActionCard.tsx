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
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';

const useStyles = makeStyles(theme => ({
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[6],
    },
  },
  content: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  iconBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    height: 64,
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.primary.light,
    margin: '0 auto',
    '& svg': {
      fontSize: 32,
      color: theme.palette.primary.main,
    },
  },
  title: {
    fontWeight: 600,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  actions: {
    padding: theme.spacing(2),
    justifyContent: 'center',
  },
}));

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  onAction: () => void;
}

export const ActionCard = ({
  title,
  description,
  icon,
  buttonText,
  onAction,
}: ActionCardProps) => {
  const classes = useStyles();

  return (
    <Card className={classes.card} onClick={onAction} elevation={2}>
      <CardContent className={classes.content}>
        <Box className={classes.iconBox}>{icon}</Box>
        <Typography variant="h6" className={classes.title}>
          {title}
        </Typography>
        <Typography variant="body2" className={classes.description}>
          {description}
        </Typography>
      </CardContent>
      <CardActions className={classes.actions}>
        <Button
          variant="contained"
          color="primary"
          endIcon={<ArrowForwardIcon />}
          onClick={e => {
            e.stopPropagation();
            onAction();
          }}
        >
          {buttonText}
        </Button>
      </CardActions>
    </Card>
  );
};

