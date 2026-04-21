"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EhrConnection = void 0;
const typeorm_1 = require("typeorm");
let EhrConnection = class EhrConnection {
    id;
    userId;
    provider;
    fhirBaseUrl;
    authorizeUrl;
    tokenUrl;
    patientId;
    encounterId;
    fhirUser;
    accessTokenEncrypted;
    refreshTokenEncrypted;
    scope;
    tokenType;
    accessTokenExpiresAt;
    createdAt;
    updatedAt;
};
exports.EhrConnection = EhrConnection;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EhrConnection.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], EhrConnection.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], EhrConnection.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], EhrConnection.prototype, "fhirBaseUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EhrConnection.prototype, "authorizeUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EhrConnection.prototype, "tokenUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EhrConnection.prototype, "patientId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EhrConnection.prototype, "encounterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EhrConnection.prototype, "fhirUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], EhrConnection.prototype, "accessTokenEncrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EhrConnection.prototype, "refreshTokenEncrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EhrConnection.prototype, "scope", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EhrConnection.prototype, "tokenType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], EhrConnection.prototype, "accessTokenExpiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EhrConnection.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EhrConnection.prototype, "updatedAt", void 0);
exports.EhrConnection = EhrConnection = __decorate([
    (0, typeorm_1.Entity)('ehr_connections'),
    (0, typeorm_1.Index)('IDX_ehr_connection_user_provider', ['userId', 'provider'], {
        unique: true,
    })
], EhrConnection);
//# sourceMappingURL=ehr-connection.entity.js.map