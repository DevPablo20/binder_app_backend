export const Layer = {
  Access: 'Access',
  Business: 'Business',
  Media: 'Media',
  Bridge: 'Bridge',
  System: 'System',
} as const;

export const layerTag = (layer: string, resource: string) =>
  `${layer} · ${resource}`;
