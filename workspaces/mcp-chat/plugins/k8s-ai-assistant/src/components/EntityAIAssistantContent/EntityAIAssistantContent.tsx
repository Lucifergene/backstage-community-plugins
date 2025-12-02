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
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import { useK8sResources } from './hooks';
import { LandingPage } from './components';

export const EntityAIAssistantContent = () => {
  // Data fetching
  const { k8sResources, loading, error } = useK8sResources();

  // Loading state
  if (loading) {
    return <Progress />;
  }

  // Error state
  if (error) {
    return (
      <ResponseErrorPanel
        error={new Error(error)}
        title="Failed to load Kubernetes resources"
      />
    );
  }

  // Empty state - still show the landing page even with no resources
  if (k8sResources.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            No Kubernetes Resources Found
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            This entity doesn't have any Kubernetes resources associated with
            it. Make sure the entity has the proper Kubernetes annotations.
          </Typography>
          <Typography
            variant="body2"
            component="pre"
            style={{
              backgroundColor: '#f5f5f5',
              padding: '8px',
              borderRadius: '4px',
            }}
          >
            {`backstage.io/kubernetes-id: my-app
backstage.io/kubernetes-namespace: default`}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Main content - single page with all sections
  return <LandingPage k8sResources={k8sResources} />;
};
