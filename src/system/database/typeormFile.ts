import { DataSource } from 'typeorm';
import { buildTypeOrmConfig } from './typeorm.config';

const dataSource = new DataSource(buildTypeOrmConfig());
export default dataSource;
