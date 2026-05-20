"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim());
    app.enableCors({ origin: allowedOrigins, credentials: true });
    await app.listen(3002, '::');
    console.log(`User service is running on: ${await app.getUrl()}`);
    app.connectMicroservice({
        transport: microservices_1.Transport.RMQ,
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
//# sourceMappingURL=main.js.map