import React, { useState } from 'react';
import Box from '@material-ui/core/Box';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import { GeneralChat } from './GeneralChat';

export const AiAssistantChatTab = () => {
  const [enableK8sMCP, setEnableK8sMCP] = useState(true);
  const [enableRAG, setEnableRAG] = useState(true);

  return (
    <>
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="flex-end"
        alignItems="center"
        width="100%"
        mb={1}
        gap={2}
      >
        <FormControlLabel
          control={
            <Switch
              checked={enableK8sMCP}
              onChange={e => setEnableK8sMCP(e.target.checked)}
            />
          }
          label="K8s MCP Server"
        />
        <FormControlLabel
          control={
            <Switch
              checked={enableRAG}
              onChange={e => setEnableRAG(e.target.checked)}
            />
          }
          label="RAG"
        />
      </Box>
      <Box flex={1} display="flex" flexDirection="column">
        <GeneralChat
          enableMCPTools={enableK8sMCP}
          enableRAG={enableRAG}
        />
      </Box>
    </>
  );
};
