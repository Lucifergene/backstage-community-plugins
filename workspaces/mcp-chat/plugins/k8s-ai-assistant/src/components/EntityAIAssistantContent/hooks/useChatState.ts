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
import { UnifiedMessage } from '../../../types';

export const useChatState = () => {
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);

  const addMessage = useCallback((message: UnifiedMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const addMessages = useCallback((newMessages: UnifiedMessage[]) => {
    setMessages(prev => [...prev, ...newMessages]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const getToolMessages = useCallback(
    (toolId: string) => {
      return messages.filter(m => m.toolContext?.toolId === toolId);
    },
    [messages],
  );

  const getConversationHistory = useCallback(() => {
    return messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
  }, [messages]);

  return {
    messages,
    addMessage,
    addMessages,
    clearMessages,
    getToolMessages,
    getConversationHistory,
  };
};

