import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { BotIcon } from './BotIcon';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(2),
    '& > *:not(:last-child)': {
      marginRight: theme.spacing(1),
    },
  },
  avatar: {
    width: 35,
    height: 35,
    fontSize: '1rem',
    backgroundColor: 'transparent',
    color: theme.palette.text.secondary,
  },
  card: {
    backgroundColor: 'transparent',
    border: 0,
    maxWidth: '70%',
  },
  cardContent: {
    padding: `${theme.spacing(1.5)}px ${theme.spacing(2)}px !important`,
  },
  dotsContainer: {
    display: 'flex',
    alignItems: 'center',
    '& > *:not(:last-child)': {
      marginRight: theme.spacing(0.5),
    },
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: theme.palette.text.secondary,
    animation: '$typing 1.4s infinite',
  },
  typingDot2: {
    animationDelay: '0.2s',
  },
  typingDot3: {
    animationDelay: '0.4s',
  },
  typingText: {
    marginLeft: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  '@keyframes typing': {
    '0%, 60%, 100%': {
      transform: 'translateY(0)',
      opacity: 0.5,
    },
    '30%': {
      transform: 'translateY(-10px)',
      opacity: 1,
    },
  },
}));

export const TypingIndicator: React.FC = () => {
  const classes = useStyles();
  const isDarkMode = false; // Will use theme mode in future

  return (
    <Box className={classes.container}>
      <Avatar className={classes.avatar}>
        <BotIcon size={30} color={isDarkMode ? '#fff' : '#666'} />
      </Avatar>
      <Card elevation={0} className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Box className={classes.dotsContainer}>
            <Box className={classes.typingDot} />
            <Box className={`${classes.typingDot} ${classes.typingDot2}`} />
            <Box className={`${classes.typingDot} ${classes.typingDot3}`} />
            <Typography variant="caption" className={classes.typingText}>
              Hang on...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
