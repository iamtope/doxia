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
var SmartAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartAuthService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rxjs_1 = require("rxjs");
const url_1 = require("url");
const ehr_connection_entity_1 = require("../entities/ehr-connection.entity");
const oauth_state_entity_1 = require("../entities/oauth-state.entity");
const crypto_service_1 = require("../crypto.service");
const smart_discovery_service_1 = require("./smart-discovery.service");
const pkce_util_1 = require("./pkce.util");
const provider_registry_1 = require("../providers/provider-registry");
let SmartAuthService = SmartAuthService_1 = class SmartAuthService {
    http;
    discovery;
    crypto;
    connections;
    states;
    logger = new common_1.Logger(SmartAuthService_1.name);
    constructor(http, discovery, crypto, connections, states) {
        this.http = http;
        this.discovery = discovery;
        this.crypto = crypto;
        this.connections = connections;
        this.states = states;
    }
    async buildAuthorizeUrl(params) {
        const config = (0, provider_registry_1.getProviderConfig)(params.provider);
        const fhirBaseUrl = params.iss || config.fhirBaseUrl;
        const { authorizeUrl, tokenUrl } = config.authorizeUrl && config.tokenUrl && !params.iss
            ? { authorizeUrl: config.authorizeUrl, tokenUrl: config.tokenUrl }
            : await this.discovery.discover(fhirBaseUrl, {
                authorizeUrl: config.authorizeUrl,
                tokenUrl: config.tokenUrl,
            });
        const codeVerifier = (0, pkce_util_1.generateCodeVerifier)();
        const state = (0, pkce_util_1.generateState)();
        await this.states.save(this.states.create({
            state,
            provider: params.provider,
            codeVerifier,
            userId: params.userId,
            fhirBaseUrl,
            authorizeUrl,
            tokenUrl,
            launch: params.launch ?? null,
            redirectUri: config.redirectUri,
            scope: config.scopes,
        }));
        const query = new url_1.URLSearchParams({
            response_type: 'code',
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            scope: config.scopes,
            state,
            aud: fhirBaseUrl,
            code_challenge: (0, pkce_util_1.codeChallengeFromVerifier)(codeVerifier),
            code_challenge_method: 'S256',
        });
        if (params.launch) {
            query.set('launch', params.launch);
        }
        return { redirectUrl: `${authorizeUrl}?${query.toString()}` };
    }
    async handleCallback(code, state) {
        if (!code || !state) {
            throw new common_1.BadRequestException('Missing code or state');
        }
        const stateRow = await this.states.findOne({ where: { state } });
        if (!stateRow) {
            throw new common_1.UnauthorizedException('Unknown or expired state');
        }
        const TEN_MINUTES = 10 * 60 * 1000;
        if (Date.now() - new Date(stateRow.createdAt).getTime() > TEN_MINUTES) {
            await this.states.delete({ id: stateRow.id });
            throw new common_1.UnauthorizedException('OAuth state expired');
        }
        const config = (0, provider_registry_1.getProviderConfig)(stateRow.provider);
        const tokenRes = await this.exchangeToken(config, stateRow.tokenUrl, {
            grant_type: 'authorization_code',
            code,
            redirect_uri: stateRow.redirectUri,
            client_id: config.clientId,
            code_verifier: stateRow.codeVerifier,
        });
        await this.states.delete({ id: stateRow.id });
        return this.upsertConnection(stateRow.userId, stateRow.provider, {
            fhirBaseUrl: stateRow.fhirBaseUrl,
            authorizeUrl: stateRow.authorizeUrl,
            tokenUrl: stateRow.tokenUrl,
            tokenResponse: tokenRes,
        });
    }
    async getValidAccessToken(userId, provider) {
        const conn = await this.connections.findOne({
            where: { userId, provider },
        });
        if (!conn) {
            throw new common_1.NotFoundException(`No ${provider} connection found for user`);
        }
        const msUntilExpiry = new Date(conn.accessTokenExpiresAt).getTime() - Date.now();
        if (msUntilExpiry > 60_000) {
            return {
                connection: conn,
                accessToken: this.crypto.decrypt(conn.accessTokenEncrypted),
            };
        }
        if (!conn.refreshTokenEncrypted) {
            throw new common_1.UnauthorizedException(`${provider} access token expired and no refresh token available; user must re-authorize`);
        }
        const config = (0, provider_registry_1.getProviderConfig)(provider);
        let tokenUrl = conn.tokenUrl;
        let authorizeUrl = conn.authorizeUrl;
        if (!tokenUrl || !authorizeUrl) {
            const discovered = await this.discovery.discover(conn.fhirBaseUrl);
            tokenUrl = tokenUrl ?? discovered.tokenUrl;
            authorizeUrl = authorizeUrl ?? discovered.authorizeUrl;
        }
        const refreshToken = this.crypto.decrypt(conn.refreshTokenEncrypted);
        const tokenRes = await this.exchangeToken(config, tokenUrl, {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: config.clientId,
        }).catch((err) => {
            this.logger.error(`${provider} refresh failed`, err.message);
            throw new common_1.UnauthorizedException(`${provider} refresh token is no longer valid; user must re-authorize`);
        });
        const updated = await this.upsertConnection(userId, provider, {
            fhirBaseUrl: conn.fhirBaseUrl,
            authorizeUrl,
            tokenUrl,
            tokenResponse: {
                ...tokenRes,
                refresh_token: tokenRes.refresh_token || refreshToken,
            },
        });
        return {
            connection: updated,
            accessToken: this.crypto.decrypt(updated.accessTokenEncrypted),
        };
    }
    async getConnection(userId, provider) {
        return this.connections.findOne({ where: { userId, provider } });
    }
    async listConnectionsForUser(userId) {
        return this.connections.find({ where: { userId } });
    }
    async disconnect(userId, provider) {
        await this.connections.delete({ userId, provider });
    }
    async purgeExpiredStates() {
        const cutoff = new Date(Date.now() - 60 * 60 * 1000);
        await this.states.delete({ createdAt: (0, typeorm_2.LessThan)(cutoff) });
    }
    async exchangeToken(config, tokenUrl, params) {
        const body = new url_1.URLSearchParams(params);
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
        };
        if (config.clientSecret) {
            const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
            headers.Authorization = `Basic ${basic}`;
        }
        const { data } = await (0, rxjs_1.firstValueFrom)(this.http.post(tokenUrl, body.toString(), {
            headers,
            timeout: 15_000,
        }));
        return data;
    }
    async upsertConnection(userId, provider, args) {
        const { fhirBaseUrl, authorizeUrl, tokenUrl, tokenResponse } = args;
        const existing = await this.connections.findOne({
            where: { userId, provider },
        });
        const expiresAt = new Date(Date.now() + (tokenResponse.expires_in ?? 3600) * 1000);
        const record = {
            userId,
            provider,
            fhirBaseUrl,
            authorizeUrl,
            tokenUrl,
            patientId: tokenResponse.patient ?? existing?.patientId ?? null,
            encounterId: tokenResponse.encounter ?? existing?.encounterId ?? null,
            fhirUser: tokenResponse.fhirUser ?? existing?.fhirUser ?? null,
            accessTokenEncrypted: this.crypto.encrypt(tokenResponse.access_token),
            refreshTokenEncrypted: tokenResponse.refresh_token
                ? this.crypto.encrypt(tokenResponse.refresh_token)
                : existing?.refreshTokenEncrypted ?? null,
            scope: tokenResponse.scope ?? existing?.scope ?? null,
            tokenType: tokenResponse.token_type ?? 'Bearer',
            accessTokenExpiresAt: expiresAt,
        };
        if (existing) {
            await this.connections.update({ id: existing.id }, record);
            return (await this.connections.findOne({ where: { id: existing.id } }));
        }
        return this.connections.save(this.connections.create(record));
    }
};
exports.SmartAuthService = SmartAuthService;
exports.SmartAuthService = SmartAuthService = SmartAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(ehr_connection_entity_1.EhrConnection)),
    __param(4, (0, typeorm_1.InjectRepository)(oauth_state_entity_1.OAuthState)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        smart_discovery_service_1.SmartDiscoveryService,
        crypto_service_1.CryptoService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SmartAuthService);
//# sourceMappingURL=smart-auth.service.js.map