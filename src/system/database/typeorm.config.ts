import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

export const buildTypeOrmConfig = (
  config?: Pick<ConfigService, 'get'>,
): DataSourceOptions => ({
  type: 'postgres',
  host: config?.get<string>('DB_HOST') ?? process.env.DB_HOST,
  port: Number(config?.get<string>('DB_PORT') ?? process.env.DB_PORT),
  username: config?.get<string>('DB_USER') ?? process.env.DB_USER,
  password: config?.get<string>('DB_PASSWORD') ?? process.env.DB_PASSWORD,
  database: config?.get<string>('DB_DATABASE') ?? process.env.DB_DATABASE,
  synchronize: false,
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
