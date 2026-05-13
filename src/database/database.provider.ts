import { DataSource } from 'typeorm';
import {
    COMPANY_REPOSITORY,
    DATA_SOURCE,
    USER_REPOSITORY,
    CAMPAIGN_REPOSITORY,
} from './constants';
import dataSource from './typeormFile';
import { User } from 'src/user/user.entity';
import { Company } from 'src/company/company.entity';
import { Campaign } from 'src/campaign/campaign.entity';

export const databaseProviders = [
    {
        provide: DATA_SOURCE,
        useFactory: async () => {
            return dataSource.initialize()
        }
    },
    {
        provide: USER_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
        inject: [DATA_SOURCE]
    },
    {
        provide: CAMPAIGN_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Campaign),
        inject: [DATA_SOURCE]
    },
    {
        provide: COMPANY_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Company),
        inject: [DATA_SOURCE]
    }
]