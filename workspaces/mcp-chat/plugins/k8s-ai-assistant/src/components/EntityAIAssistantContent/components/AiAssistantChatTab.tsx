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
import { useState } from 'react';
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
        style={{ gap: 16 }}
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
        <GeneralChat enableMCPTools={enableK8sMCP} enableRAG={enableRAG} />
      </Box>
    </>
  );
};
