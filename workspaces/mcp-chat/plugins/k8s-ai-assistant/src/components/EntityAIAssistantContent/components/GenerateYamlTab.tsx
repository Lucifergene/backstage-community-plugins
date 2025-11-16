import React, { useState, useRef } from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Editor from '@monaco-editor/react';
import GetAppIcon from '@material-ui/icons/GetApp';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { YamlChat } from './YamlChat';
import { YamlQuickPrompts } from './YamlQuickPrompts';

const DEFAULT_YAML = `# Generated YAML will appear here
# Use the chat on the left to generate Kubernetes manifests

# Example:
# "Generate a Deployment for nginx"
# "Create a Service for my-app"
# "Generate a ConfigMap for database config"`;

export const GenerateYamlTab = () => {
  const [yamlContent, setYamlContent] = useState(DEFAULT_YAML);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(
    undefined,
  );
  const [enableRAG, setEnableRAG] = useState(false);
  const editorRef = useRef<any>(null);

  const handleYamlAdd = (yaml: string) => {
    setYamlContent(yaml);
  };

  const handlePromptSelect = (prompt: string) => {
    setInitialPrompt(prompt);
    setShowQuickPrompts(false);
  };

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

  return (
    <Box display="flex" height="100%" overflow="auto">
      {/* Left Panel: Chat - flexible but constrained */}
      <Box
        flex={1}
        minWidth="400px"
        maxWidth="50%"
        p={2}
        borderRight="1px solid #ccc"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">
            YAML Generator Chat
          </Typography>
        </Box>
        
        {/* RAG Controls */}
        <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
          <FormControlLabel
            control={
              <Switch
                checked={enableRAG}
                onChange={e => setEnableRAG(e.target.checked)}
                color="primary"
                size="small"
              />
            }
            label={
              <Typography variant="body2">
                Use Knowledge Base
              </Typography>
            }
          />
        </Box>

        <Typography variant="body2" color="textSecondary" paragraph>
          {enableRAG 
            ? 'Generating with YAML examples from your knowledge base'
            : 'Describe the Kubernetes resource you need'}
        </Typography>

        <Box flex={1} overflow="auto">
          {showQuickPrompts ? (
            <YamlQuickPrompts 
              onPromptSelect={handlePromptSelect}
              showExamples={enableRAG}
            />
          ) : (
            <YamlChat
              onYamlAdd={handleYamlAdd}
              initialPrompt={initialPrompt}
              onPromptSent={() => setInitialPrompt(undefined)}
              enableRAG={enableRAG}
            />
          )}
        </Box>
      </Box>

      {/* Right Panel: Editor - guaranteed minimum width */}
      <Box
        flex={1}
        minWidth="500px"
        p={2}
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          flexShrink={0}
        >
          <Typography variant="h6">YAML Editor</Typography>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<FileCopyIcon />}
              style={{ marginRight: '8px' }}
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
        <Box flex={1} overflow="hidden">
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
      </Box>
    </Box>
  );
};
