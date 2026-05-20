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
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const axios_1 = require("@nestjs/axios");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const google_auth_service_1 = require("./google-auth.service");
const user_entity_1 = require("./user.entity");
const note_entity_1 = require("./note.entity");
const rabbitmq_module_1 = require("./rabbitmq.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                username: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_NAME || 'doxxia_users',
                entities: [user_entity_1.User, note_entity_1.Note],
                synchronize: process.env.TYPEORM_SYNC === 'true',
            }),
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, note_entity_1.Note]),
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET,
                signOptions: { expiresIn: '1d' },
            }),
            rabbitmq_module_1.RabbitMQModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, google_auth_service_1.GoogleAuthService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map