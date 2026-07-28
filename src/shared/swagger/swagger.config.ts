import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { layerTag, Layer } from './layer-tags';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Binder — Semantic Control Plane')
    .setDescription(
      'Metadata and mappings for the marketing data lake. ' +
        'Layers: Access (permissions) → Business (Client/Campaign) → ' +
        'Media (catalog) → Bridge (platform ID matching) → Analytics (facts ⋈ Bridge).',
    )
    .setVersion('1.0')
    .build();
}

export function applySwaggerTagGroups(document: OpenAPIObject): OpenAPIObject {
  document['x-tagGroups'] = [
    {
      name: 'Access — who can use the system',
      tags: [
        layerTag(Layer.Access, 'Auth'),
        layerTag(Layer.Access, 'User'),
        layerTag(Layer.Access, 'Company'),
        layerTag(Layer.Access, 'UserCompany'),
        layerTag(Layer.Access, 'Invite'),
      ],
    },
    {
      name: 'Business — contracts and initiatives',
      tags: [
        layerTag(Layer.Business, 'Client'),
        layerTag(Layer.Business, 'Campaign'),
      ],
    },
    {
      name: 'Media — ad vocabulary catalog',
      tags: [
        layerTag(Layer.Media, 'Platform'),
        layerTag(Layer.Media, 'Channel'),
        layerTag(Layer.Media, 'BuyingType'),
        layerTag(Layer.Media, 'Grouping'),
        layerTag(Layer.Media, 'SubGrouping'),
      ],
    },
    {
      name: 'Bridge — lake row matching',
      tags: [
        layerTag(Layer.Bridge, 'Catalog'),
        layerTag(Layer.Bridge, 'PlatformAccount'),
        layerTag(Layer.Bridge, 'PlatformObjectMap'),
      ],
    },
    {
      name: 'Analytics — dashboard metrics',
      tags: [layerTag(Layer.Analytics, 'Metrics')],
    },
    {
      name: 'System — application mechanics',
      tags: [layerTag(Layer.System, 'Database')],
    },
  ];

  return document;
}
