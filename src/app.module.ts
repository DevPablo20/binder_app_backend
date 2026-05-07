import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [AuthModule, DatabaseModule, UserModule, ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: [`./.env.${process.env.NODE_ENV}`]
  })],
  controllers: [],
  providers: [],
})
export class AppModule { }
