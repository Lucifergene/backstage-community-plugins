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
import React from 'react';
import { Page, Header, Content } from '@backstage/core-components';
import { LandingPage } from '../EntityAIAssistantContent/components/LandingPage';

/**
 * Standalone K8s AI Assistant page that doesn't require entity context.
 * This can be used as a navigation item in the Backstage app.
 */
export const K8sAiAssistantPage = () => {
  return (
    <Page themeId="tool">
      <Header
        title="Kubernetes AI Assistant"
        subtitle="Interact with Kubernetes resources using AI assistance"
      />
      <Content>
        {/* Pass empty array since we're not in entity context */}
        <LandingPage k8sResources={[]} />
      </Content>
    </Page>
  );
};

