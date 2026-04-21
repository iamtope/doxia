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
var FhirService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FhirService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const smart_auth_service_1 = require("../smart/smart-auth.service");
let FhirService = FhirService_1 = class FhirService {
    http;
    auth;
    logger = new common_1.Logger(FhirService_1.name);
    constructor(http, auth) {
        this.http = http;
        this.auth = auth;
    }
    async request(userId, provider, method, path, options = {}) {
        const { connection, accessToken } = await this.auth.getValidAccessToken(userId, provider);
        const url = `${connection.fhirBaseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
        const cleanParams = {};
        if (options.params) {
            for (const [k, v] of Object.entries(options.params)) {
                if (v !== undefined && v !== null && v !== '')
                    cleanParams[k] = String(v);
            }
        }
        const config = {
            method,
            url,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: options.accept || 'application/fhir+json',
                ...(options.body
                    ? { 'Content-Type': options.contentType || 'application/fhir+json' }
                    : {}),
            },
            params: Object.keys(cleanParams).length ? cleanParams : undefined,
            data: options.body,
            timeout: 20_000,
        };
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.http.request(config));
            return data;
        }
        catch (err) {
            const status = err?.response?.status;
            const body = err?.response?.data;
            this.logger.error(`${provider} FHIR ${method} ${path} failed: status=${status} body=${JSON.stringify(body)}`);
            if (status === 404) {
                throw new common_1.NotFoundException(`${provider} FHIR resource not found: ${path}`);
            }
            throw new common_1.BadGatewayException(`${provider} FHIR request failed${status ? ` (status ${status})` : ''}`);
        }
    }
    async readResource(userId, provider, resource, id) {
        return this.request(userId, provider, 'GET', `${resource}/${encodeURIComponent(id)}`);
    }
    async searchResource(userId, provider, resource, params) {
        return this.request(userId, provider, 'GET', resource, { params });
    }
    async getPatient(userId, provider, patientId) {
        return this.readResource(userId, provider, 'Patient', patientId);
    }
    async getConditions(userId, provider, patientId) {
        return this.searchResource(userId, provider, 'Condition', {
            patient: patientId,
            category: 'problem-list-item',
        });
    }
    async getAllergies(userId, provider, patientId) {
        return this.searchResource(userId, provider, 'AllergyIntolerance', {
            patient: patientId,
        });
    }
    async getMedications(userId, provider, patientId) {
        return this.searchResource(userId, provider, 'MedicationRequest', {
            patient: patientId,
            status: 'active',
        });
    }
    async getVitals(userId, provider, patientId) {
        return this.searchResource(userId, provider, 'Observation', {
            patient: patientId,
            category: 'vital-signs',
        });
    }
    async createNoteDocumentReference(userId, provider, args) {
        const documentReference = {
            resourceType: 'DocumentReference',
            status: 'current',
            docStatus: 'preliminary',
            type: {
                coding: [
                    {
                        system: 'http://loinc.org',
                        code: args.loincCode || '11506-3',
                        display: 'Progress note',
                    },
                ],
            },
            subject: { reference: `Patient/${args.patientId}` },
            date: new Date().toISOString(),
            description: args.title,
            ...(args.authorReference
                ? { author: [{ reference: args.authorReference }] }
                : {}),
            content: [
                {
                    attachment: {
                        contentType: args.contentType || 'text/plain',
                        data: args.contentBase64,
                        title: args.title,
                    },
                },
            ],
            ...(args.encounterId
                ? {
                    context: {
                        encounter: [{ reference: `Encounter/${args.encounterId}` }],
                    },
                }
                : {}),
        };
        return this.request(userId, provider, 'POST', 'DocumentReference', {
            body: documentReference,
        });
    }
};
exports.FhirService = FhirService;
exports.FhirService = FhirService = FhirService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        smart_auth_service_1.SmartAuthService])
], FhirService);
//# sourceMappingURL=fhir.service.js.map