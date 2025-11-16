import { ObjectsByEntityResponse } from '@backstage/plugin-kubernetes-common';

export interface K8sResource {
  id: string; // Generated unique ID
  name: string; // Resource name
  kind: string; // Resource type (Pod, Deployment, etc.)
  namespace: string; // Kubernetes namespace
  status: string; // Derived status (Running, Failed, Pending, etc.)
  createdAt: Date; // Creation timestamp
  cluster: string; // Cluster name
  raw: any; // Raw K8s object for detailed operations
}

// Determine Pod status from phase and conditions
export function getPodStatus(pod: any): string {
  const phase = pod.status?.phase || 'Unknown';

  // Check if pod is being terminated
  if (pod.metadata?.deletionTimestamp) {
    return 'Terminating';
  }

  // Check container statuses for more specific status
  const containerStatuses = pod.status?.containerStatuses || [];
  const hasFailedContainers = containerStatuses.some(
    (cs: any) =>
      cs.state?.waiting?.reason === 'CrashLoopBackOff' ||
      cs.state?.waiting?.reason === 'ImagePullBackOff' ||
      cs.state?.terminated?.reason === 'Error',
  );

  if (hasFailedContainers) {
    return 'Failed';
  }

  // Check if all containers are ready
  const allReady =
    containerStatuses.length > 0 &&
    containerStatuses.every((cs: any) => cs.ready);
  if (phase === 'Running' && !allReady) {
    return 'Not Ready';
  }

  return phase; // Running, Pending, Succeeded, Failed, Unknown
}

// Determine Deployment status
export function getDeploymentStatus(deployment: any): string {
  const spec = deployment.spec;
  const status = deployment.status;

  if (!status) return 'Unknown';

  const desiredReplicas = spec?.replicas || 0;
  const availableReplicas = status.availableReplicas || 0;
  const updatedReplicas = status.updatedReplicas || 0;

  if (availableReplicas === 0) {
    return 'Failed';
  }

  if (availableReplicas < desiredReplicas) {
    return 'Degraded';
  }

  if (updatedReplicas < desiredReplicas) {
    return 'Updating';
  }

  return 'Running';
}

// Determine Service status (services don't have phases, so we check basic info)
export function getServiceStatus(service: any): string {
  const spec = service.spec;

  if (!spec) return 'Unknown';

  // LoadBalancer services need external IP
  if (spec.type === 'LoadBalancer') {
    const hasExternalIP =
      (service.status?.loadBalancer?.ingress?.length || 0) > 0;
    return hasExternalIP ? 'Ready' : 'Pending';
  }

  return 'Ready';
}

// Generic status determination
export function getResourceStatus(resource: any, kind: string): string {
  switch (kind) {
    case 'Pod':
      return getPodStatus(resource);
    case 'Deployment':
      return getDeploymentStatus(resource);
    case 'Service':
      return getServiceStatus(resource);
    case 'ReplicaSet':
    case 'StatefulSet':
    case 'DaemonSet':
      // Similar logic to Deployment
      const desiredReplicas = resource.spec?.replicas || 0;
      const readyReplicas = resource.status?.readyReplicas || 0;
      return readyReplicas >= desiredReplicas ? 'Running' : 'Degraded';
    default:
      return 'Active'; // Default for other resources
  }
}

// Transform Kubernetes API response to table rows
export function transformK8sResources(
  kubernetesObjects: ObjectsByEntityResponse | undefined,
): K8sResource[] {
  if (!kubernetesObjects || !kubernetesObjects.items) {
    return [];
  }

  const resources: K8sResource[] = [];
  let idCounter = 1;

  kubernetesObjects.items.forEach(clusterObject => {
    const clusterName = clusterObject.cluster.name;

    clusterObject.resources.forEach(fetchResponse => {
      const kind = getKindFromType(fetchResponse.type);

      (fetchResponse.resources as any[]).forEach(resource => {
        const metadata = resource.metadata;

        if (!metadata?.name) return; // Skip if no name

        resources.push({
          id: `${clusterName}-${kind}-${metadata.namespace}-${
            metadata.name
          }-${idCounter++}`,
          name: metadata.name,
          kind: kind,
          namespace: metadata.namespace || 'default',
          status: getResourceStatus(resource, kind),
          createdAt: metadata.creationTimestamp
            ? new Date(metadata.creationTimestamp)
            : new Date(),
          cluster: clusterName,
          raw: resource,
        });
      });
    });
  });

  return resources;
}

// Map fetch response type to Kind
function getKindFromType(type: string): string {
  const typeMap: Record<string, string> = {
    pods: 'Pod',
    deployments: 'Deployment',
    services: 'Service',
    replicasets: 'ReplicaSet',
    statefulsets: 'StatefulSet',
    daemonsets: 'DaemonSet',
    jobs: 'Job',
    cronjobs: 'CronJob',
    ingresses: 'Ingress',
    configmaps: 'ConfigMap',
    secrets: 'Secret',
    horizontalpodautoscalers: 'HorizontalPodAutoscaler',
    limitranges: 'LimitRange',
    resourcequotas: 'ResourceQuota',
  };

  return typeMap[type] || capitalize(type.replace(/s$/, '')); // fallback
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Extract all unique resource kinds for filtering
export function extractUniqueKinds(resources: K8sResource[]): string[] {
  return Array.from(new Set(resources.map(r => r.kind))).sort();
}

// Get status color for UI display
export function getStatusColor(status: string): string {
  switch (status) {
    case 'Running':
    case 'Ready':
    case 'Active':
    case 'Succeeded':
      return '#4caf50'; // Green
    case 'Failed':
    case 'Error':
    case 'CrashLoopBackOff':
      return '#f44336'; // Red
    case 'Pending':
    case 'Updating':
    case 'Terminating':
      return '#ff9800'; // Orange
    case 'Degraded':
    case 'Not Ready':
      return '#ff5722'; // Deep Orange
    default:
      return '#757575'; // Gray
  }
}
