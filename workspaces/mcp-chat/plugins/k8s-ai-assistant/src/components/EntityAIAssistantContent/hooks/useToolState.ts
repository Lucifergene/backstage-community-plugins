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

import { useState, useCallback } from 'react';

interface ToolState {
  [toolId: string]: any;
}

export const useToolState = () => {
  const [activeTool, setActiveToolInternal] = useState<string | null>('general-chat');
  const [toolStates, setToolStates] = useState<ToolState>({});

  const setActiveTool = useCallback((toolId: string) => {
    setActiveToolInternal(toolId);
  }, []);

  const getToolState = useCallback(
    (toolId: string) => {
      return toolStates[toolId] || {};
    },
    [toolStates],
  );

  const saveToolState = useCallback((toolId: string, state: any) => {
    setToolStates(prev => ({
      ...prev,
      [toolId]: state,
    }));
  }, []);

  const updateToolState = useCallback((toolId: string, updates: any) => {
    setToolStates(prev => ({
      ...prev,
      [toolId]: {
        ...(prev[toolId] || {}),
        ...updates,
      },
    }));
  }, []);

  return {
    activeTool,
    setActiveTool,
    getToolState,
    saveToolState,
    updateToolState,
  };
};

