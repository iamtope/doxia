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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EhrController = void 0;
const common_1 = require("@nestjs/common");
const smart_auth_service_1 = require("./smart/smart-auth.service");
const fhir_service_1 = require("./fhir/fhir.service");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const provider_registry_1 = require("./providers/provider-registry");
let EhrController = class EhrController {
    auth;
    fhir;
    constructor(auth, fhir) {
        this.auth = auth;
        this.fhir = fhir;
    }
    health() {
        return { ok: true, service: 'ehr-service' };
    }
    providers() {
        return { providers: (0, provider_registry_1.listProviders)() };
    }
    async connections(req) {
        const rows = await this.auth.listConnectionsForUser(req.user.sub);
        return {
            connections: rows.map((r) => ({
                provider: r.provider,
                fhirBaseUrl: r.fhirBaseUrl,
                patientId: r.patientId,
                encounterId: r.encounterId,
                fhirUser: r.fhirUser,
                scope: r.scope,
                accessTokenExpiresAt: r.accessTokenExpiresAt,
            })),
        };
    }
    async authorize(req, res, provider, iss, launch) {
        const p = this.assertProvider(provider);
        const { redirectUrl } = await this.auth.buildAuthorizeUrl({
            provider: p,
            userId: req.user.sub,
            iss,
            launch,
        });
        return res.redirect(redirectUrl);
    }
    async launch(req, res, provider, iss, launch) {
        if (!iss) {
            throw new common_1.BadRequestException('EHR launch requires iss parameter');
        }
        const p = this.assertProvider(provider);
        const { redirectUrl } = await this.auth.buildAuthorizeUrl({
            provider: p,
            userId: req.user.sub,
            iss,
            launch,
        });
        return res.redirect(redirectUrl);
    }
    async callback(res, provider, code, state, error, errorDescription) {
        this.assertProvider(provider);
        const successUrl = process.env.EHR_FRONTEND_SUCCESS_URL ||
            `http://localhost:3000/dashboard/integrations?ehr=connected&provider=${provider}`;
        const errorUrl = process.env.EHR_FRONTEND_ERROR_URL ||
            `http://localhost:3000/dashboard/integrations?ehr=error&provider=${provider}`;
        if (error) {
            const msg = encodeURIComponent(errorDescription || error);
            return res.redirect(`${errorUrl}&message=${msg}`);
        }
        try {
            await this.auth.handleCallback(code, state);
            return res.redirect(successUrl);
        }
        catch (err) {
            const msg = encodeURIComponent(err.message || 'EHR connect failed');
            return res.redirect(`${errorUrl}&message=${msg}`);
        }
    }
    async getConnection(req, provider) {
        const p = this.assertProvider(provider);
        const conn = await this.auth.getConnection(req.user.sub, p);
        if (!conn)
            return { connected: false, provider: p };
        return {
            connected: true,
            provider: p,
            fhirBaseUrl: conn.fhirBaseUrl,
            patientId: conn.patientId,
            encounterId: conn.encounterId,
            fhirUser: conn.fhirUser,
            scope: conn.scope,
            accessTokenExpiresAt: conn.accessTokenExpiresAt,
        };
    }
    async disconnect(req, provider) {
        const p = this.assertProvider(provider);
        await this.auth.disconnect(req.user.sub, p);
        return { ok: true, provider: p };
    }
    async getPatient(req, provider, id) {
        const p = this.assertProvider(provider);
        return this.fhir.getPatient(req.user.sub, p, id);
    }
    async getConditions(req, provider, id) {
        const p = this.assertProvider(provider);
        return this.fhir.getConditions(req.user.sub, p, id);
    }
    async getAllergies(req, provider, id) {
        const p = this.assertProvider(provider);
        return this.fhir.getAllergies(req.user.sub, p, id);
    }
    async getMedications(req, provider, id) {
        const p = this.assertProvider(provider);
        return this.fhir.getMedications(req.user.sub, p, id);
    }
    async getVitals(req, provider, id) {
        const p = this.assertProvider(provider);
        return this.fhir.getVitals(req.user.sub, p, id);
    }
    async postDocument(req, provider, patientId, body) {
        const p = this.assertProvider(provider);
        if (!body?.title || !body?.content) {
            throw new common_1.BadRequestException('title and content are required');
        }
        const contentBase64 = Buffer.from(body.content, 'utf8').toString('base64');
        return this.fhir.createNoteDocumentReference(req.user.sub, p, {
            patientId,
            encounterId: body.encounterId,
            title: body.title,
            contentBase64,
            contentType: body.contentType,
            loincCode: body.loincCode,
            authorReference: body.authorReference,
        });
    }
    assertProvider(provider) {
        if (!provider_registry_1.SUPPORTED_PROVIDERS.includes(provider)) {
            throw new common_1.BadRequestException(`Unsupported EHR provider '${provider}'. Supported: ${provider_registry_1.SUPPORTED_PROVIDERS.join(', ')}`);
        }
        return provider;
    }
};
exports.EhrController = EhrController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EhrController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('providers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EhrController.prototype, "providers", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('connections'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EhrController.prototype, "connections", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':provider/authorize'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Param)('provider')),
    __param(3, (0, common_1.Query)('iss')),
    __param(4, (0, common_1.Query)('launch')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], EhrController.prototype, "authorize", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':provider/launch'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Param)('provider')),
    __param(3, (0, common_1.Query)('iss')),
    __param(4, (0, common_1.Query)('launch')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], EhrController.prototype, "launch", null);
__decorate([
    (0, common_1.Get)(':provider/callback'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Param)('provider')),
    __param(2, (0, common_1.Query)('code')),
    __param(3, (0, common_1.Query)('state')),
    __param(4, (0, common_1.Query)('error')),
    __param(5, (0, common_1.Query)('error_description')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], EhrController.prototype, "callback", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':provider/connection'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EhrController.prototype, "getConnection", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':provider/connection'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EhrController.prototype, "disconnect", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':provider/patient/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('provider')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EhrController.prototype, "getPatient", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':provider/patient/:id/conditions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('provider')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EhrController.prototype, "getConditions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':provider/patient/:id/allergies'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('provider')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EhrController.prototype, "getAllergies", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':provider/patient/:id/medications'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('provider')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EhrController.prototype, "getMedications", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':provider/patient/:id/vitals'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('provider')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EhrController.prototype, "getVitals", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':provider/patient/:id/document'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('provider')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], EhrController.prototype, "postDocument", null);
exports.EhrController = EhrController = __decorate([
    (0, common_1.Controller)('ehr'),
    __metadata("design:paramtypes", [smart_auth_service_1.SmartAuthService,
        fhir_service_1.FhirService])
], EhrController);
//# sourceMappingURL=ehr.controller.js.map