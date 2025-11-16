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

import React, { useState, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import GetAppIcon from '@material-ui/icons/GetApp';
import SaveIcon from '@material-ui/icons/Save';
import Editor from '@monaco-editor/react';

const useStyles = makeStyles(theme => ({
  overlay: {
    width: '70%',
    height: '100%',
    borderLeft: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
    animation: '$slideIn 0.3s ease-out',
  },
  '@keyframes slideIn': {
    from: {
      transform: 'translateX(100%)',
    },
    to: {
      transform: 'translateX(0)',
    },
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  title: {
    fontWeight: 600,
    fontSize: '1.1rem',
  },
  editorContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
}));

interface YamlEditorOverlayProps {
  yaml: string;
  onClose: () => void;
  onSave?: (yaml: string) => void;
}

export const YamlEditorOverlay: React.FC<YamlEditorOverlayProps> = ({
  yaml,
  onClose,
  onSave,
}) => {
  const classes = useStyles();
  const [yamlContent, setYamlContent] = useState(yaml);
  const editorRef = useRef<any>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlContent);
  };

  const handleDownload = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kubernetes-manifest.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(yamlContent);
    }
    onClose();
  };

  return (
    <Box className={classes.overlay}>
      <Box className={classes.header}>
        <Typography className={classes.title}>YAML Editor</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box className={classes.editorContainer}>
        <Editor
          height="100%"
          defaultLanguage="yaml"
          value={yamlContent}
          onChange={value => setYamlContent(value || '')}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
          }}
          onMount={editor => {
            editorRef.current = editor;
          }}
        />
      </Box>

      <Box className={classes.footer}>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<FileCopyIcon />}
          onClick={handleCopy}
        >
          Copy
        </Button>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<GetAppIcon />}
          onClick={handleDownload}
        >
          Download
        </Button>
      </Box>
    </Box>
  );
};

