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
var SmartDiscoveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartDiscoveryService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let SmartDiscoveryService = SmartDiscoveryService_1 = class SmartDiscoveryService {
    http;
    logger = new common_1.Logger(SmartDiscoveryService_1.name);
    cache = new Map();
    constructor(http) {
        this.http = http;
    }
    async discover(fhirBaseUrl, overrides) {
        const base = fhirBaseUrl.replace(/\/+$/, '');
        if (overrides?.authorizeUrl && overrides?.tokenUrl) {
            return {
                authorizeUrl: overrides.authorizeUrl,
                tokenUrl: overrides.tokenUrl,
            };
        }
        if (this.cache.has(base)) {
            const cached = this.cache.get(base);
            return {
                authorizeUrl: overrides?.authorizeUrl ?? cached.authorizeUrl,
                tokenUrl: overrides?.tokenUrl ?? cached.tokenUrl,
            };
        }
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.http.get(`${base}/.well-known/smart-configuration`, {
                headers: { Accept: 'application/json' },
                timeout: 10_000,
            }));
            if (data?.authorization_endpoint && data?.token_endpoint) {
                const endpoints = {
                    authorizeUrl: overrides?.authorizeUrl ?? data.authorization_endpoint,
                    tokenUrl: overrides?.tokenUrl ?? data.token_endpoint,
                };
                this.cache.set(base, {
                    authorizeUrl: data.authorization_endpoint,
                    tokenUrl: data.token_endpoint,
                });
                return endpoints;
            }
        }
        catch (err) {
            this.logger.warn(`smart-configuration lookup failed for ${base}: ${err.message}`);
        }
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.http.get(`${base}/metadata`, {
                headers: { Accept: 'application/fhir+json' },
                timeout: 10_000,
            }));
            const security = data?.rest?.[0]?.security?.extension?.find((e) => e.url ===
                'http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris');
            const authorizeUrl = security?.extension?.find((e) => e.url === 'authorize')?.valueUri;
            const tokenUrl = security?.extension?.find((e) => e.url === 'token')
                ?.valueUri;
            if (authorizeUrl && tokenUrl) {
                this.cache.set(base, { authorizeUrl, tokenUrl });
                return {
                    authorizeUrl: overrides?.authorizeUrl ?? authorizeUrl,
                    tokenUrl: overrides?.tokenUrl ?? tokenUrl,
                };
            }
        }
        catch (err) {
            this.logger.warn(`CapabilityStatement lookup failed for ${base}: ${err.message}`);
        }
        throw new common_1.BadGatewayException(`Could not discover SMART on FHIR endpoints for ${base}`);
    }
};
exports.SmartDiscoveryService = SmartDiscoveryService;
exports.SmartDiscoveryService = SmartDiscoveryService = SmartDiscoveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], SmartDiscoveryService);
//# sourceMappingURL=smart-discovery.service.js.map