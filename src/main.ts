import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import {
  applySwaggerTagGroups,
  buildSwaggerConfig,
} from './shared/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const config = buildSwaggerConfig();
  const document = SwaggerModule.createDocument(app, config);
  applySwaggerTagGroups(document);
  SwaggerModule.setup('api', app, document);

  const corsOrigin = configService.get<string>('FRONTEND_HOST');

  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  });

  await app.listen(process.env.APP_PORT ?? 3000);
}
bootstrap();
