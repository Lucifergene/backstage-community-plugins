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
import {
  createPlugin,
  createRoutableExtension,
  createComponentExtension,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
  IconComponent,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { k8sAiAssistantApiRef } from './api';
import { K8sAiAssistant } from './api/K8sAiAssistantApi';
import { K8sAiAssistantIconComponent } from './components/K8sAiAssistantIcon';

export const k8SAiAssistantPlugin = createPlugin({
  id: 'k8s-ai-assistant',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: k8sAiAssistantApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new K8sAiAssistant({ discoveryApi, fetchApi }),
    }),
  ],
});

export const K8SAiAssistantPage = k8SAiAssistantPlugin.provide(
  createRoutableExtension({
    name: 'K8SAiAssistantPage',
    component: () =>
      import('./components/K8sAiAssistantPage').then(m => m.K8sAiAssistantPage),
    mountPoint: rootRouteRef,
  }),
);

export const EntityK8sAiAssistantContent = k8SAiAssistantPlugin.provide(
  createComponentExtension({
    name: 'EntityK8sAiAssistantContent',
    component: {
      lazy: () =>
        import('./components/EntityAIAssistantContent').then(
          m => m.EntityAIAssistantContent,
        ),
    },
  }),
);

/**
 * K8s AI Assistant Icon
 * @public
 */
export const K8sAiAssistantIcon: IconComponent = K8sAiAssistantIconComponent;
