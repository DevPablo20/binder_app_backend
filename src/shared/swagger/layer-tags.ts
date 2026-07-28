export const Layer = {
  Access: 'Access',
  Business: 'Business',
  Media: 'Media',
  Bridge: 'Bridge',
  Analytics: 'Analytics',
  System: 'System',
} as const;

export const layerTag = (layer: string, resource: string) =>
  `${layer} · ${resource}`;
