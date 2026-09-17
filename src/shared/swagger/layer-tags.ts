export const Layer = {
  Access: 'Access',
  Business: 'Business',
  Media: 'Media',
  Bridge: 'Bridge',
  Enrichment: 'Enrichment',
  System: 'System',
} as const;

export const layerTag = (layer: string, resource: string) =>
  `${layer} · ${resource}`;
