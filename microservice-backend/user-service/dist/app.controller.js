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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const google_auth_service_1 = require("./google-auth.service");
const microservices_1 = require("@nestjs/microservices");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
let AppController = class AppController {
    appService;
    googleAuth;
    constructor(appService, googleAuth) {
        this.appService = appService;
        this.googleAuth = googleAuth;
    }
    getHello() {
        return this.appService.getHello();
    }
    async signup(signupDto) {
        return this.appService.signup(signupDto);
    }
    async login(loginDto) {
        return this.appService.login(loginDto);
    }
    googleAuthorize(res) {
        const url = this.googleAuth.buildAuthorizeUrl();
        return res.redirect(url);
    }
    async googleCallback(code, state, oauthError, res) {
        const redirectUrl = oauthError
            ? this.googleAuth.buildErrorRedirect(oauthError)
            : await this.googleAuth.handleCallback(code, state);
        return res.redirect(redirectUrl);
    }
    async saveNote(req, data) {
        const userId = req.user.sub;
        return this.appService.saveNote(userId, data.note);
    }
    async updateNote(req, id, data) {
        const userId = req.user.sub;
        return this.appService.updateNote(userId, id, data.note);
    }
    async getMyNotes(req) {
        const userId = req.user.sub;
        return this.appService.getNotes(userId);
    }
    async getNotes(req, userId) {
        if (req.user.sub !== parseInt(userId, 10)) {
            return this.appService.getNotes(req.user.sub);
        }
        return this.appService.getNotes(parseInt(userId, 10));
    }
    async handleSignup(data) {
        return this.appService.signup(data);
    }
    async handleLogin(data) {
        return this.appService.login(data);
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Post)('signup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "signup", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('google/authorize'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "googleAuthorize", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Query)('error')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('notes'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "saveNote", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('notes/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateNote", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('notes'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMyNotes", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('notes/:userId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getNotes", null);
__decorate([
    (0, microservices_1.MessagePattern)('user.signup'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "handleSignup", null);
__decorate([
    (0, microservices_1.MessagePattern)('user.login'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "handleLogin", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [app_service_1.AppService,
        google_auth_service_1.GoogleAuthService])
], AppController);
//# sourceMappingURL=app.controller.js.map