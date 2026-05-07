import { DataSource } from 'typeorm';
import {
    DATA_SOURCE,
    USER_REPOSITORY,
} from './constants';
import dataSource from './typeormFile';
import { User } from 'src/user/user.entity';

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
    }
]