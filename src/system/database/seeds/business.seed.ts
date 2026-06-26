import { DataSource } from 'typeorm';
import { Company } from '../../../access/company/company.entity';
import { Client } from '../../../business/client/client.entity';
import { Campaign } from '../../../business/campaign/campaign.entity';
import { logSeed, upsertScoped } from './seed-helpers';
import {
  SEED_CAMPAIGN_DESCRIPTION,
  SEED_CAMPAIGN_NAME,
  SEED_CLIENT_DESCRIPTION,
  SEED_CLIENT_NAME,
  SEED_COMPANY_NAME,
} from './seed-data';

export async function seedBusiness(dataSource: DataSource): Promise<void> {
  logSeed('Iniciando seed da camada Business');

  const companyRepository = dataSource.getRepository(Company);
  const clientRepository = dataSource.getRepository(Client);
  const campaignRepository = dataSource.getRepository(Campaign);

  const company = await companyRepository.findOne({
    where: { name: SEED_COMPANY_NAME },
  });

  if (!company) {
    throw new Error(
      `Empresa "${SEED_COMPANY_NAME}" nao encontrada. Execute npm run seed:access primeiro.`,
    );
  }

  const client = await upsertScoped(
    clientRepository,
    { company: { id: company.id }, name: SEED_CLIENT_NAME },
    {
      name: SEED_CLIENT_NAME,
      description: SEED_CLIENT_DESCRIPTION,
      isActive: true,
      company,
    },
    (entity) => {
      entity.description = SEED_CLIENT_DESCRIPTION;
      entity.isActive = true;
    },
    'Cliente',
    SEED_CLIENT_NAME,
  );

  await upsertScoped(
    campaignRepository,
    { client: { id: client.id }, name: SEED_CAMPAIGN_NAME },
    {
      name: SEED_CAMPAIGN_NAME,
      description: SEED_CAMPAIGN_DESCRIPTION,
      isActive: true,
      client,
    },
    (entity) => {
      entity.description = SEED_CAMPAIGN_DESCRIPTION;
      entity.isActive = true;
    },
    'Campanha',
    SEED_CAMPAIGN_NAME,
  );

  logSeed('Seed da camada Business concluido');
}
