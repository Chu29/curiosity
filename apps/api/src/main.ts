import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { validateEnv } from '@curiosity/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const possibleEnvPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ];

  for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
      process.loadEnvFile(envPath);
      break;
    }
  }

  const env = validateEnv();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.enableCors({
    // Reflect the requesting origin so browser clients from any host can
    // reach the API while credentials remain enabled.
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Request-Id',
      'X-Guest-Token',
    ],
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = env.PORT;
  await app.listen(port);
  app.get(Logger).log(`API running on http://localhost:${port}/api/v1`);
}

bootstrap();
