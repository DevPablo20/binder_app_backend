import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CompanyModule } from './company/company.module';
import { UserCompanyModule } from './user-company/user-company.module';
import { InviteModule } from './invite/invite.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    CompanyModule,
    UserCompanyModule,
    InviteModule,
  ],
  exports: [
    AuthModule,
    UserModule,
    CompanyModule,
    UserCompanyModule,
    InviteModule,
  ],
})
export class AccessModule {}
