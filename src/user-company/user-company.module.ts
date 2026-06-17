import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCompany } from './user-company.entity';
import { UserCompanyService } from './user-company.service';
import { User } from 'src/user/user.entity';
import { Company } from 'src/company/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserCompany, User, Company])],
  providers: [UserCompanyService],
  exports: [UserCompanyService],
})
export class UserCompanyModule {}
