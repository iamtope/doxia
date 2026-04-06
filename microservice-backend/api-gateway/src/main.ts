import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim());
  app.enableCors({ origin: allowedOrigins, credentials: true });
  await app.listen(3003, '0.0.0.0');
  console.log(`API Gateway is running on: ${await app.getUrl()}`);
}
bootstrap();
