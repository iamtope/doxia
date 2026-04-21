import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

export type EhrProvider = 'epic' | 'cerner';

export const SUPPORTED_PROVIDERS: EhrProvider[] = ['epic', 'cerner'];

export interface ProviderConfig {
  provider: EhrProvider;
  displayName: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  fhirBaseUrl: string;
  authorizeUrl?: string;
  tokenUrl?: string;
  scopes: string;
}

const DEFAULTS: Record<EhrProvider, Partial<ProviderConfig> & { displayName: string }> = {
  epic: {
    displayName: 'Epic',
    fhirBaseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
    authorizeUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
    tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
    scopes:
      'openid fhirUser launch/patient patient/Patient.read patient/Condition.read patient/AllergyIntolerance.read patient/MedicationRequest.read patient/Observation.read patient/DocumentReference.write offline_access',
  },
  cerner: {
    displayName: 'Cerner / Oracle Health',
    // Cerner public R4 sandbox tenant GUID
    fhirBaseUrl:
      'https://fhir-ehr-code.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d',
    authorizeUrl:
      'https://authorization.cerner.com/tenants/ec2458f2-1e24-41c8-b71b-0e701af7583d/protocols/oauth2/profiles/smart-v1/personas/provider/authorize',
    tokenUrl:
      'https://authorization.cerner.com/tenants/ec2458f2-1e24-41c8-b71b-0e701af7583d/protocols/oauth2/profiles/smart-v1/token',
    scopes:
      'openid fhirUser launch/patient patient/Patient.read patient/Condition.read patient/AllergyIntolerance.read patient/MedicationRequest.read patient/Observation.read patient/DocumentReference.write offline_access',
  },
};

/**
 * Resolve a provider's runtime config from environment variables, falling back
 * to vendor-specific defaults (typically sandbox URLs) for any value not set.
 *
 * Env precedence (example for Epic):
 *   EPIC_CLIENT_ID         - required
 *   EPIC_CLIENT_SECRET     - optional (confidential clients only)
 *   EPIC_REDIRECT_URI      - required
 *   EPIC_FHIR_BASE_URL     - optional (defaults to sandbox)
 *   EPIC_AUTHORIZE_URL     - optional
 *   EPIC_TOKEN_URL         - optional
 *   EPIC_SCOPES            - optional
 */
export function getProviderConfig(provider: string): ProviderConfig {
  if (!SUPPORTED_PROVIDERS.includes(provider as EhrProvider)) {
    throw new BadRequestException(`Unsupported EHR provider: ${provider}`);
  }
  const p = provider as EhrProvider;
  const prefix = p.toUpperCase();
  const defaults = DEFAULTS[p];

  const clientId = process.env[`${prefix}_CLIENT_ID`];
  const redirectUri = process.env[`${prefix}_REDIRECT_URI`];
  if (!clientId) {
    throw new InternalServerErrorException(
      `${prefix}_CLIENT_ID is not configured`,
    );
  }
  if (!redirectUri) {
    throw new InternalServerErrorException(
      `${prefix}_REDIRECT_URI is not configured`,
    );
  }

  return {
    provider: p,
    displayName: defaults.displayName,
    clientId,
    clientSecret: process.env[`${prefix}_CLIENT_SECRET`] || undefined,
    redirectUri,
    fhirBaseUrl:
      process.env[`${prefix}_FHIR_BASE_URL`] || (defaults.fhirBaseUrl as string),
    authorizeUrl: process.env[`${prefix}_AUTHORIZE_URL`] || defaults.authorizeUrl,
    tokenUrl: process.env[`${prefix}_TOKEN_URL`] || defaults.tokenUrl,
    scopes: process.env[`${prefix}_SCOPES`] || (defaults.scopes as string),
  };
}

export function getProviderDisplayName(provider: EhrProvider): string {
  return DEFAULTS[provider].displayName;
}

/**
 * Returns a lightweight list of provider metadata suitable for the frontend to
 * render connection cards without leaking secrets.
 */
export function listProviders(): Array<{
  provider: EhrProvider;
  displayName: string;
  configured: boolean;
}> {
  return SUPPORTED_PROVIDERS.map((p) => {
    const prefix = p.toUpperCase();
    const configured = Boolean(
      process.env[`${prefix}_CLIENT_ID`] && process.env[`${prefix}_REDIRECT_URI`],
    );
    return {
      provider: p,
      displayName: DEFAULTS[p].displayName,
      configured,
    };
  });
}
