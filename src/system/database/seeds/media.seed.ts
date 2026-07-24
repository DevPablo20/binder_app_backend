import { DataSource } from 'typeorm';
import { Client } from '../../../business/client/client.entity';
import { Campaign } from '../../../business/campaign/campaign.entity';
import { BuyingType } from '../../../media/platform/buying-type.entity';
import { Platform } from '../../../media/platform/platform.entity';
import { Channel } from '../../../media/platform/channel.entity';
import { Format } from '../../../media/format/format.entity';
import { SubFormat } from '../../../media/format/sub-format.entity';
import { Grouping } from '../../../media/grouping/grouping.entity';
import { SubGrouping } from '../../../media/grouping/sub-grouping.entity';
import {
  logSeed,
  syncChannelBuyingTypes,
  upsertByUniqueName,
  upsertScoped,
} from './seed-helpers';
import {
  SEED_BUYING_TYPES,
  SEED_CAMPAIGN_NAME,
  SEED_CHANNELS,
  SEED_CLIENT_NAME,
  SEED_FORMATS,
  SEED_GROUPINGS,
  SEED_PLATFORM_CATALOG_KEY,
  SEED_PLATFORM_DESCRIPTION,
  SEED_PLATFORM_NAME,
} from './seed-data';

export async function seedMedia(dataSource: DataSource): Promise<void> {
  logSeed('Iniciando seed da camada Media');

  const buyingTypeRepository = dataSource.getRepository(BuyingType);
  const platformRepository = dataSource.getRepository(Platform);
  const channelRepository = dataSource.getRepository(Channel);
  const formatRepository = dataSource.getRepository(Format);
  const subFormatRepository = dataSource.getRepository(SubFormat);
  const groupingRepository = dataSource.getRepository(Grouping);
  const subGroupingRepository = dataSource.getRepository(SubGrouping);
  const clientRepository = dataSource.getRepository(Client);
  const campaignRepository = dataSource.getRepository(Campaign);

  const buyingTypesByName = new Map<string, BuyingType>();

  for (const item of SEED_BUYING_TYPES) {
    const buyingType = await upsertByUniqueName(
      buyingTypeRepository,
      item.name,
      { description: item.description, isActive: true },
      (entity) => {
        entity.description = item.description;
        entity.isActive = true;
      },
      'Tipo de compra',
    );
    buyingTypesByName.set(item.name, buyingType);
  }

  const platform = await upsertByUniqueName(
    platformRepository,
    SEED_PLATFORM_NAME,
    {
      description: SEED_PLATFORM_DESCRIPTION,
      catalogKey: SEED_PLATFORM_CATALOG_KEY,
      isActive: true,
    },
    (entity) => {
      entity.description = SEED_PLATFORM_DESCRIPTION;
      entity.catalogKey = SEED_PLATFORM_CATALOG_KEY;
      entity.isActive = true;
    },
    'Plataforma',
  );

  for (const item of SEED_CHANNELS) {
    const buyingTypes = item.buyingTypeNames.map(
      (name) => buyingTypesByName.get(name)!,
    );

    const channel = await upsertScoped(
      channelRepository,
      { platform: { id: platform.id }, name: item.name },
      {
        name: item.name,
        description: item.description,
        isActive: true,
        platform,
        buyingTypes,
      },
      (entity) => {
        entity.description = item.description;
        entity.isActive = true;
      },
      'Canal',
      item.name,
    );

    await syncChannelBuyingTypes(channelRepository, channel, buyingTypes);
  }

  for (const formatItem of SEED_FORMATS) {
    const format = await upsertByUniqueName(
      formatRepository,
      formatItem.name,
      { description: formatItem.description, isActive: true },
      (entity) => {
        entity.description = formatItem.description;
        entity.isActive = true;
      },
      'Formato',
    );

    for (const subFormatItem of formatItem.subFormats) {
      await upsertScoped(
        subFormatRepository,
        { format: { id: format.id }, name: subFormatItem.name },
        {
          name: subFormatItem.name,
          description: subFormatItem.description,
          isActive: true,
          format,
        },
        (entity) => {
          entity.description = subFormatItem.description;
          entity.isActive = true;
        },
        'Subformato',
        `${formatItem.name} / ${subFormatItem.name}`,
      );
    }
  }

  const client = await clientRepository.findOne({
    where: { name: SEED_CLIENT_NAME },
  });

  if (!client) {
    throw new Error(
      `Cliente "${SEED_CLIENT_NAME}" nao encontrado. Execute npm run seed:business primeiro.`,
    );
  }

  const campaign = await campaignRepository.findOne({
    where: { client: { id: client.id }, name: SEED_CAMPAIGN_NAME },
  });

  if (!campaign) {
    throw new Error(
      `Campanha "${SEED_CAMPAIGN_NAME}" nao encontrada. Execute npm run seed:business primeiro.`,
    );
  }

  for (const groupingItem of SEED_GROUPINGS) {
    const grouping = await upsertScoped(
      groupingRepository,
      { campaign: { id: campaign.id }, name: groupingItem.name },
      {
        name: groupingItem.name,
        description: groupingItem.description,
        isActive: true,
        campaign,
      },
      (entity) => {
        entity.description = groupingItem.description;
        entity.isActive = true;
      },
      'Agrupamento',
      groupingItem.name,
    );

    for (const subGroupingItem of groupingItem.subGroupings) {
      await upsertScoped(
        subGroupingRepository,
        { grouping: { id: grouping.id }, name: subGroupingItem.name },
        {
          name: subGroupingItem.name,
          description: subGroupingItem.description,
          isActive: true,
          grouping,
        },
        (entity) => {
          entity.description = subGroupingItem.description;
          entity.isActive = true;
        },
        'Subagrupamento',
        `${groupingItem.name} / ${subGroupingItem.name}`,
      );
    }
  }

  logSeed('Seed da camada Media concluido');
}
