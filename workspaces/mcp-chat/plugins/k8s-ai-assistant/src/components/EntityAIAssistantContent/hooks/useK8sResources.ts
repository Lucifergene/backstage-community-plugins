import { useMemo } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useKubernetesObjects } from '@backstage/plugin-kubernetes-react';
import { transformK8sResources, extractUniqueKinds } from '../utils';

export function useK8sResources() {
  const { entity } = useEntity();

  // Fetch Kubernetes resources (use very large interval to effectively disable auto-refresh)
  const { kubernetesObjects, loading, error } = useKubernetesObjects(
    entity,
    1000000000, // ~11.5 days - effectively no auto-refresh
  );

  const k8sResources = useMemo(
    () => transformK8sResources(kubernetesObjects),
    [kubernetesObjects],
  );

  const allKinds = useMemo(
    () => extractUniqueKinds(k8sResources),
    [k8sResources],
  );

  return {
    k8sResources,
    allKinds,
    loading,
    error,
  };
}
