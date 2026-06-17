import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './client.entity';
import { Company } from 'src/company/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Company])],
})
export class ClientModule {}
