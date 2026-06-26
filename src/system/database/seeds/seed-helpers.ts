import 'reflect-metadata';
import {
  DataSource,
  DeepPartial,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import dataSource from '../typeormFile';
import { Channel } from '../../../media/platform/channel.entity';
import { BuyingType } from '../../../media/platform/buying-type.entity';

export function logSeed(message: string): void {
  console.log(`[seed] ${message}`);
}

export async function withDataSource(
  fn: (ds: DataSource) => Promise<void>,
): Promise<void> {
  await dataSource.initialize();

  try {
    await fn(dataSource);
    logSeed('Finalizado com sucesso');
  } catch (error) {
    console.error('[seed] Erro ao executar seed', error);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

type UpsertEntity = ObjectLiteral & { name: string; isActive?: boolean };

export async function upsertByUniqueName<T extends UpsertEntity>(
  repository: Repository<T>,
  name: string,
  defaults: DeepPartial<T>,
  syncFields: (entity: T) => void,
  label: string,
): Promise<T> {
  let entity = await repository.findOne({
    where: { name } as FindOptionsWhere<T>,
  });

  if (!entity) {
    entity = repository.create({ ...defaults, name } as DeepPartial<T>);
    await repository.save(entity);
    logSeed(`${label} criado: ${name}`);
    return entity;
  }

  syncFields(entity);
  await repository.save(entity);
  logSeed(`${label} ja existia, dados sincronizados: ${name}`);
  return entity;
}

export async function upsertScoped<T extends ObjectLiteral>(
  repository: Repository<T>,
  where: FindOptionsWhere<T>,
  defaults: DeepPartial<T>,
  syncFields: (entity: T) => void,
  label: string,
  displayName: string,
): Promise<T> {
  let entity = await repository.findOne({ where });

  if (!entity) {
    entity = repository.create(defaults);
    await repository.save(entity);
    logSeed(`${label} criado: ${displayName}`);
    return entity;
  }

  syncFields(entity);
  await repository.save(entity);
  logSeed(`${label} ja existia, dados sincronizados: ${displayName}`);
  return entity;
}

export async function syncChannelBuyingTypes(
  channelRepository: Repository<Channel>,
  channel: Channel,
  buyingTypes: BuyingType[],
): Promise<void> {
  const withRelations = await channelRepository.findOne({
    where: { id: channel.id },
    relations: { buyingTypes: true },
  });

  if (!withRelations) {
    return;
  }

  withRelations.buyingTypes = buyingTypes;
  await channelRepository.save(withRelations);
}
