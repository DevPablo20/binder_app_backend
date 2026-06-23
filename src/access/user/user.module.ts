import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';
import { UserCompany } from 'src/access/user-company/user-company.entity';
import { UserCompanyModule } from 'src/access/user-company/user-company.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserCompany]), UserCompanyModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
