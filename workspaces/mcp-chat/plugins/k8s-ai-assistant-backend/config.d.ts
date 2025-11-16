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

export interface Config {
  /** Configuration options for the K8s AI Assistant plugin */
  k8sAiAssistant?: {
    /**
     * NOTE: RAG configuration (embedding providers and vector stores) has been moved
     * to the knowledge-base-backend plugin. Configure them under the 'knowledgeBase'
     * namespace in app-config.yaml instead.
     * @see @internal/backstage-plugin-knowledge-base-backend for RAG configuration
     */

    /**
     * Kubernetes MCP Server configuration
     * @visibility backend
     */
    kubernetesServer?: {
      /**
       * NPM package for K8s MCP server
       * @visibility backend
       */
      npxCommand?: string;
      /**
       * Script path for K8s MCP server
       * @visibility backend
       */
      scriptPath?: string;
      /**
       * Environment variables
       * @visibility backend
       */
      env?: Record<string, string>;
    };
    /**
     * System prompt for log explanations
     * @visibility backend
     */
    systemPrompt?: string;
    /**
     * System prompt for YAML generation
     * @visibility backend
     */
    yamlGenerationPrompt?: string;
  };
}
