import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCompany } from './user-company.entity';
import { UserCompanyService } from './user-company.service';
import { UserCompanyController } from './user-company.controller';
import { User } from 'src/access/user/user.entity';
import { Company } from 'src/access/company/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserCompany, User, Company])],
  controllers: [UserCompanyController],
  providers: [UserCompanyService],
  exports: [UserCompanyService],
})
export class UserCompanyModule {}
