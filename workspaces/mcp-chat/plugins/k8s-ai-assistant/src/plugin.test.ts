import { k8SAiAssistantPlugin } from './plugin';

describe('k8s-ai-assistant', () => {
  it('should export plugin', () => {
    expect(k8SAiAssistantPlugin).toBeDefined();
  });
});
