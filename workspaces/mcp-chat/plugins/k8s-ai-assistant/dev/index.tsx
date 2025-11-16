import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { k8SAiAssistantPlugin, K8SAiAssistantPage } from '../src/plugin';

createDevApp()
  .registerPlugin(k8SAiAssistantPlugin)
  .addPage({
    element: <K8SAiAssistantPage />,
    title: 'Root Page',
    path: '/k8s-ai-assistant',
  })
  .render();
