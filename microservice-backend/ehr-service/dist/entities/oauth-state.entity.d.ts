import type { EhrProvider } from '../providers/provider-registry';
export declare class OAuthState {
    id: number;
    state: string;
    provider: EhrProvider;
    codeVerifier: string;
    userId: number;
    fhirBaseUrl: string;
    authorizeUrl: string;
    tokenUrl: string;
    launch: string | null;
    redirectUri: string;
    scope: string;
    createdAt: Date;
}
