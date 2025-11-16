import { createBackend } from '@backstage/backend-defaults';
import { mockServices } from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';

/**
 * Unified backend for K8s AI Assistant development.
 * This loads all related backend plugins on a single backend instance.
 * 
 * This prevents port conflicts when running multiple backend plugins together.
 */

const backend = createBackend();

// Mock services for development
backend.add(mockServices.auth.factory());
backend.add(mockServices.httpAuth.factory());

backend.add(
  catalogServiceMock.factory({
    entities: [
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'sample',
          title: 'Sample Component',
        },
        spec: {
          type: 'service',
        },
      },
    ],
  }),
);

// Add k8s-ai-assistant-backend
// Note: knowledge-base-backend is loaded as a dependency/service, not as a separate plugin
backend.add(import('../src'));

backend.start();
