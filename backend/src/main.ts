// Load .env BEFORE any other imports
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Debug: Check if environment variables are loaded
  console.log('🔍 DATABASE_URL loaded:', process.env.DATABASE_URL ? '✅ Yes' : '❌ No');
  if (process.env.DATABASE_URL) {
    console.log('🔗 Connection:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));
  }
  
  const app = await NestFactory.create(AppModule);
  
  // Apply /api prefix to ALL routes
  app.setGlobalPrefix('api');
  
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Quanby Task Manager API')
    .setDescription('Task management system REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`\n🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`🔐 Google OAuth: http://localhost:${port}/api/auth/google`);
  console.log(`📍 OAuth Callback: http://localhost:${port}/api/auth/callback/google`);
  console.log(`📝 Register: http://localhost:${port}/api/auth/register`);
  console.log(`🔑 Login: http://localhost:${port}/api/auth/login`);
  console.log(`✉️  Verify Email: http://localhost:${port}/api/auth/verify-email\n`);
}
bootstrap();