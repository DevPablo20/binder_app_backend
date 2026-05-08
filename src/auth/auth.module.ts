import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';
import { JwtSignOptions } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.getOrThrow<string>('JWT_SECRET_KEY'),
        signOptions: {
          expiresIn: config.getOrThrow<JwtSignOptions['expiresIn']>('JWT_EXPIRES_IN'),
        }
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ],
  exports: [AuthService]
})
export class AuthModule { }