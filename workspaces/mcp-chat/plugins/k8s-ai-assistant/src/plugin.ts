import {
  createPlugin,
  createRoutableExtension,
  createComponentExtension,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { k8sAiAssistantApiRef } from './api';
import { K8sAiAssistant } from './api/K8sAiAssistantApi';

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
      import('./components/K8sAiAssistantPage').then(
        m => m.K8sAiAssistantPage,
      ),
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
