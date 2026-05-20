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
exports.GoogleAuthService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const crypto_1 = require("crypto");
const url_1 = require("url");
const app_service_1 = require("./app.service");
let GoogleAuthService = class GoogleAuthService {
    http;
    appService;
    pendingStates = new Map();
    constructor(http, appService) {
        this.http = http;
        this.appService = appService;
    }
    get clientId() {
        const id = process.env.GOOGLE_CLIENT_ID;
        if (!id) {
            throw new common_1.BadRequestException('Google OAuth is not configured');
        }
        return id;
    }
    get clientSecret() {
        const secret = process.env.GOOGLE_CLIENT_SECRET;
        if (!secret) {
            throw new common_1.BadRequestException('Google OAuth is not configured');
        }
        return secret;
    }
    get redirectUri() {
        return (process.env.GOOGLE_REDIRECT_URI ||
            'http://localhost:3003/auth/google/callback');
    }
    get frontendCallbackUrl() {
        return (process.env.AUTH_FRONTEND_CALLBACK_URL ||
            'http://localhost:3000/auth/callback');
    }
    pruneExpiredStates() {
        const now = Date.now();
        for (const [state, expiresAt] of this.pendingStates) {
            if (expiresAt <= now)
                this.pendingStates.delete(state);
        }
    }
    registerState() {
        this.pruneExpiredStates();
        const state = (0, crypto_1.randomBytes)(24).toString('hex');
        this.pendingStates.set(state, Date.now() + 10 * 60 * 1000);
        return state;
    }
    consumeState(state) {
        if (!state)
            return false;
        const expiresAt = this.pendingStates.get(state);
        this.pendingStates.delete(state);
        return Boolean(expiresAt && expiresAt > Date.now());
    }
    buildErrorRedirect(message) {
        const base = new URL(this.frontendCallbackUrl);
        base.searchParams.set('error', message.slice(0, 200));
        return base.toString();
    }
    buildAuthorizeUrl() {
        const state = this.registerState();
        const params = new url_1.URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            state,
            access_type: 'online',
            prompt: 'select_account',
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
    async exchangeCode(code) {
        const body = new url_1.URLSearchParams({
            code,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
            grant_type: 'authorization_code',
        });
        const tokenResponse = await (0, rxjs_1.firstValueFrom)(this.http.post('https://oauth2.googleapis.com/token', body.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }));
        const data = tokenResponse.data;
        if (!data?.access_token) {
            throw new common_1.UnauthorizedException('Google token exchange failed');
        }
        return data;
    }
    async fetchUserInfo(accessToken) {
        const profileResponse = await (0, rxjs_1.firstValueFrom)(this.http.get('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        }));
        const data = profileResponse.data;
        if (!data?.sub || !data?.email) {
            throw new common_1.UnauthorizedException('Incomplete Google profile');
        }
        return data;
    }
    async handleCallback(code, state) {
        const base = new URL(this.frontendCallbackUrl);
        if (!code) {
            base.searchParams.set('error', 'missing_code');
            return base.toString();
        }
        if (!this.consumeState(state)) {
            base.searchParams.set('error', 'invalid_state');
            return base.toString();
        }
        try {
            const tokens = await this.exchangeCode(code);
            const profile = await this.fetchUserInfo(tokens.access_token);
            const auth = await this.appService.authenticateGoogleUser(profile);
            base.searchParams.set('access_token', auth.access_token);
            base.searchParams.set('user', JSON.stringify(auth.user));
            return base.toString();
        }
        catch (err) {
            const message = err?.response?.data?.error_description ||
                err?.message ||
                'google_auth_failed';
            base.searchParams.set('error', String(message).slice(0, 200));
            return base.toString();
        }
    }
};
exports.GoogleAuthService = GoogleAuthService;
exports.GoogleAuthService = GoogleAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        app_service_1.AppService])
], GoogleAuthService);
//# sourceMappingURL=google-auth.service.js.map