import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { CompanyModule } from './company/company.module';
import { MailModule } from './mail/mail.module';
import { InviteModule } from './invite/invite.module';
import { ClientModule } from './client/client.module';
import { CampaignModule } from './campaign/campaign.module';
import { PlatformModule } from './platform/platform.module';
import { FormatModule } from './format/format.module';
import { GroupingModule } from './grouping/grouping.module';
import { BridgeModule } from './bridge/bridge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`./.env.${process.env.NODE_ENV}`],
    }),
    DatabaseModule,
    AuthModule,
    UserModule,
    CompanyModule,
    MailModule,
    InviteModule,
    ClientModule,
    CampaignModule,
    PlatformModule,
    FormatModule,
    GroupingModule,
    BridgeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
