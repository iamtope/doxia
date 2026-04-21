import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim());
  app.enableCors({ origin: allowedOrigins, credentials: true });
  const port = parseInt(process.env.PORT || '3004', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`EHR service is running on: ${await app.getUrl()}`);
}
bootstrap();
