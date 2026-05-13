import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { CompanyModule } from './company/company.module';
import { CampaignModule } from './campaign/campaign.module';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    UserModule,
    ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: [`./.env.${process.env.NODE_ENV}`]
  }),
    CompanyModule,
    CampaignModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
