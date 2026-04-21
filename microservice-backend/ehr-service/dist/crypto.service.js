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
var CryptoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let CryptoService = CryptoService_1 = class CryptoService {
    logger = new common_1.Logger(CryptoService_1.name);
    key;
    constructor() {
        const raw = process.env.TOKEN_ENCRYPTION_KEY;
        if (!raw) {
            this.logger.warn('TOKEN_ENCRYPTION_KEY is not set. Deriving an ephemeral key from JWT_SECRET; tokens will not be readable after restart!');
            this.key = (0, crypto_1.createHash)('sha256')
                .update(process.env.JWT_SECRET || 'doxxia-dev-fallback')
                .digest();
        }
        else if (/^[0-9a-fA-F]{64}$/.test(raw)) {
            this.key = Buffer.from(raw, 'hex');
        }
        else {
            this.key = (0, crypto_1.createHash)('sha256').update(raw).digest();
        }
    }
    encrypt(plaintext) {
        const iv = (0, crypto_1.randomBytes)(12);
        const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', this.key, iv);
        const ciphertext = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        return `${iv.toString('base64')}.${authTag.toString('base64')}.${ciphertext.toString('base64')}`;
    }
    decrypt(payload) {
        try {
            const [ivB64, tagB64, dataB64] = payload.split('.');
            if (!ivB64 || !tagB64 || !dataB64) {
                throw new Error('Invalid ciphertext format');
            }
            const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', this.key, Buffer.from(ivB64, 'base64'));
            decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
            const plaintext = Buffer.concat([
                decipher.update(Buffer.from(dataB64, 'base64')),
                decipher.final(),
            ]);
            return plaintext.toString('utf8');
        }
        catch (err) {
            this.logger.error('Failed to decrypt token', err.message);
            throw new common_1.InternalServerErrorException('Stored token could not be decrypted');
        }
    }
};
exports.CryptoService = CryptoService;
exports.CryptoService = CryptoService = CryptoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CryptoService);
//# sourceMappingURL=crypto.service.js.map