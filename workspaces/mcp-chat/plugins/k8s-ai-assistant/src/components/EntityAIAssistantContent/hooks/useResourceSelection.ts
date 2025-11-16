import { useState } from 'react';
import { K8sResource } from '../utils';

export function useResourceSelection(k8sResources: K8sResource[]) {
  const [selectedResourceType, setSelectedResourceType] = useState('');
  const [specificResource, setSpecificResource] = useState('');

  const handleResourceTypeChange = (newType: string) => {
    setSelectedResourceType(newType);
    setSpecificResource('');

    const resourcesOfType = k8sResources.filter(r => r.kind === newType);
    const resourceNames = resourcesOfType.map(r => r.name);

    if (resourceNames.length > 0) {
      setSpecificResource(resourceNames[0]);
    }

    return resourceNames;
  };

  const handleSpecificResourceChange = (resourceName: string) => {
    setSpecificResource(resourceName);
  };

  return {
    selectedResourceType,
    specificResource,
    handleResourceTypeChange,
    handleSpecificResourceChange,
  };
}
