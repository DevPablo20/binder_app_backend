import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SystemModule } from './system/system.module';
import { AccessModule } from './access/access.module';
import { BusinessModule } from './business/business.module';
import { MediaModule } from './media/media.module';
import { BridgeModule } from './bridge/bridge.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`./.env.${process.env.NODE_ENV}`],
    }),
    SystemModule,
    AccessModule,
    BusinessModule,
    MediaModule,
    BridgeModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
