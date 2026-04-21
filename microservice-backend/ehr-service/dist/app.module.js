"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const ehr_controller_1 = require("./ehr.controller");
const smart_auth_service_1 = require("./smart/smart-auth.service");
const smart_discovery_service_1 = require("./smart/smart-discovery.service");
const fhir_service_1 = require("./fhir/fhir.service");
const crypto_service_1 = require("./crypto.service");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const ehr_connection_entity_1 = require("./entities/ehr-connection.entity");
const oauth_state_entity_1 = require("./entities/oauth-state.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule.register({ timeout: 20_000, maxRedirects: 0 }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432', 10),
                username: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_NAME || 'doxxia_users',
                entities: [ehr_connection_entity_1.EhrConnection, oauth_state_entity_1.OAuthState],
                synchronize: process.env.TYPEORM_SYNC === 'true',
            }),
            typeorm_1.TypeOrmModule.forFeature([ehr_connection_entity_1.EhrConnection, oauth_state_entity_1.OAuthState]),
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET,
                signOptions: { expiresIn: '1d' },
            }),
        ],
        controllers: [ehr_controller_1.EhrController],
        providers: [
            smart_auth_service_1.SmartAuthService,
            smart_discovery_service_1.SmartDiscoveryService,
            fhir_service_1.FhirService,
            crypto_service_1.CryptoService,
            jwt_auth_guard_1.JwtAuthGuard,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map