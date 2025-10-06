import { config } from 'dotenv';
config(); // Load .env file FIRST before any other imports

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Debug: Check if DATABASE_URL is loaded
  console.log('🔍 DATABASE_URL loaded:', process.env.DATABASE_URL ? '✅ Yes' : '❌ No');
  if (process.env.DATABASE_URL) {
    console.log('🔗 Connection:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));
  }
  
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Quanby Task Manager API')
    .setDescription('Task management system REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`\n🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs\n`);
}
bootstrap();