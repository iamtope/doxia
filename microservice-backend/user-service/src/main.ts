import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim());
  app.enableCors({ origin: allowedOrigins, credentials: true });

  await app.listen(3002, '::');
  console.log(`User service is running on: ${await app.getUrl()}`);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [RABBITMQ_URL],
      queue: 'auth_queue',
      queueOptions: { durable: false },
    },
  });
  app.startAllMicroservices()
    .then(() => console.log('RabbitMQ microservice connected'))
    .catch((err) => console.warn('RabbitMQ unavailable:', err.message));
}
bootstrap();