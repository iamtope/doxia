"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_PROVIDERS = void 0;
exports.getProviderConfig = getProviderConfig;
exports.getProviderDisplayName = getProviderDisplayName;
exports.listProviders = listProviders;
const common_1 = require("@nestjs/common");
exports.SUPPORTED_PROVIDERS = ['epic', 'cerner'];
const DEFAULTS = {
    epic: {
        displayName: 'Epic',
        fhirBaseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
        authorizeUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
        tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
        scopes: 'openid fhirUser launch/patient patient/Patient.read patient/Condition.read patient/AllergyIntolerance.read patient/MedicationRequest.read patient/Observation.read patient/DocumentReference.write offline_access',
    },
    cerner: {
        displayName: 'Cerner / Oracle Health',
        fhirBaseUrl: 'https://fhir-ehr-code.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d',
        authorizeUrl: 'https://authorization.cerner.com/tenants/ec2458f2-1e24-41c8-b71b-0e701af7583d/protocols/oauth2/profiles/smart-v1/personas/provider/authorize',
        tokenUrl: 'https://authorization.cerner.com/tenants/ec2458f2-1e24-41c8-b71b-0e701af7583d/protocols/oauth2/profiles/smart-v1/token',
        scopes: 'openid fhirUser launch/patient patient/Patient.read patient/Condition.read patient/AllergyIntolerance.read patient/MedicationRequest.read patient/Observation.read patient/DocumentReference.write offline_access',
    },
};
function getProviderConfig(provider) {
    if (!exports.SUPPORTED_PROVIDERS.includes(provider)) {
        throw new common_1.BadRequestException(`Unsupported EHR provider: ${provider}`);
    }
    const p = provider;
    const prefix = p.toUpperCase();
    const defaults = DEFAULTS[p];
    const clientId = process.env[`${prefix}_CLIENT_ID`];
    const redirectUri = process.env[`${prefix}_REDIRECT_URI`];
    if (!clientId) {
        throw new common_1.InternalServerErrorException(`${prefix}_CLIENT_ID is not configured`);
    }
    if (!redirectUri) {
        throw new common_1.InternalServerErrorException(`${prefix}_REDIRECT_URI is not configured`);
    }
    return {
        provider: p,
        displayName: defaults.displayName,
        clientId,
        clientSecret: process.env[`${prefix}_CLIENT_SECRET`] || undefined,
        redirectUri,
        fhirBaseUrl: process.env[`${prefix}_FHIR_BASE_URL`] || defaults.fhirBaseUrl,
        authorizeUrl: process.env[`${prefix}_AUTHORIZE_URL`] || defaults.authorizeUrl,
        tokenUrl: process.env[`${prefix}_TOKEN_URL`] || defaults.tokenUrl,
        scopes: process.env[`${prefix}_SCOPES`] || defaults.scopes,
    };
}
function getProviderDisplayName(provider) {
    return DEFAULTS[provider].displayName;
}
function listProviders() {
    return exports.SUPPORTED_PROVIDERS.map((p) => {
        const prefix = p.toUpperCase();
        const configured = Boolean(process.env[`${prefix}_CLIENT_ID`] && process.env[`${prefix}_REDIRECT_URI`]);
        return {
            provider: p,
            displayName: DEFAULTS[p].displayName,
            configured,
        };
    });
}
//# sourceMappingURL=provider-registry.js.map