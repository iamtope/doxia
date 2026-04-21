"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCodeVerifier = generateCodeVerifier;
exports.codeChallengeFromVerifier = codeChallengeFromVerifier;
exports.generateState = generateState;
const crypto_1 = require("crypto");
function base64UrlEncode(buf) {
    return buf
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}
function generateCodeVerifier() {
    return base64UrlEncode((0, crypto_1.randomBytes)(32));
}
function codeChallengeFromVerifier(verifier) {
    return base64UrlEncode((0, crypto_1.createHash)('sha256').update(verifier).digest());
}
function generateState() {
    return base64UrlEncode((0, crypto_1.randomBytes)(24));
}
//# sourceMappingURL=pkce.util.js.map