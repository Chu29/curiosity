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
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Request-Id'],
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
