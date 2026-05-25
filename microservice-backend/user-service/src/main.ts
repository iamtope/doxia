import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { rabbitEnabled } from './rabbitmq-enabled';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim());
  app.enableCors({ origin: allowedOrigins, credentials: true });

  await app.listen(3002, '0.0.0.0');
  console.log(`User service is running on: ${await app.getUrl()}`);

  if (rabbitEnabled()) {
    console.log('RabbitMQ publish enabled (user_created events)');
  } else {
    console.log('RabbitMQ disabled — login, signup, and notes work without it');
  }
}
bootstrap();
