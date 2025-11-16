import React from 'react';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  button: {
    justifyContent: 'flex-start',
    textTransform: 'none',
    borderColor: theme.palette.primary.main,
  },
}));

interface YamlActionButtonProps {
  yaml: string;
  index: number;
  totalBlocks: number;
  onAdd: () => void;
}

export const YamlActionButton: React.FC<YamlActionButtonProps> = ({
  index,
  totalBlocks,
  onAdd,
}) => {
  const classes = useStyles();

  const label =
    totalBlocks > 1
      ? `Add YAML Block ${index} to Editor`
      : 'Add YAML to Editor';

  return (
    <Button
      variant="outlined"
      color="primary"
      size="small"
      startIcon={<AddIcon />}
      onClick={onAdd}
      className={classes.button}
    >
      {label}
    </Button>
  );
};
