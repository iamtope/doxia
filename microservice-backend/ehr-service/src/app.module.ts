import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { EhrController } from './ehr.controller';
import { SmartAuthService } from './smart/smart-auth.service';
import { SmartDiscoveryService } from './smart/smart-discovery.service';
import { FhirService } from './fhir/fhir.service';
import { CryptoService } from './crypto.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { EhrConnection } from './entities/ehr-connection.entity';
import { OAuthState } from './entities/oauth-state.entity';

@Module({
  imports: [
    HttpModule.register({ timeout: 20_000, maxRedirects: 0 }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'doxxia_users',
      entities: [EhrConnection, OAuthState],
      synchronize: process.env.TYPEORM_SYNC !== 'false',
    }),
    TypeOrmModule.forFeature([EhrConnection, OAuthState]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [EhrController],
  providers: [
    SmartAuthService,
    SmartDiscoveryService,
    FhirService,
    CryptoService,
    JwtAuthGuard,
  ],
})
export class AppModule {}
