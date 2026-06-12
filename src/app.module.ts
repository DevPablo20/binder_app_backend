import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { CompanyModule } from './company/company.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: [`./.env.${process.env.NODE_ENV}`]
  }),
    DatabaseModule,
    AuthModule,
    UserModule,
    CompanyModule,
    MailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
