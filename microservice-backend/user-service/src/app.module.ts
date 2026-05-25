import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GoogleAuthService } from './google-auth.service';
import { User } from './user.entity';
import { Note } from './note.entity';
import { RabbitMQModule } from './rabbitmq.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'doxxia_users',
      entities: [User, Note],
      // Auto-align schema on startup (adds googleId, etc.). Set TYPEORM_SYNC=false when using migrations.
      synchronize: process.env.TYPEORM_SYNC !== 'false',
    }),
    TypeOrmModule.forFeature([User, Note]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    RabbitMQModule,
  ],
  controllers: [AppController],
  providers: [AppService, GoogleAuthService],
})
export class AppModule { }
