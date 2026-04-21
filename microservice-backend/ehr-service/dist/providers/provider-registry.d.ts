export type EhrProvider = 'epic' | 'cerner';
export declare const SUPPORTED_PROVIDERS: EhrProvider[];
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
export declare function getProviderConfig(provider: string): ProviderConfig;
export declare function getProviderDisplayName(provider: EhrProvider): string;
export declare function listProviders(): Array<{
    provider: EhrProvider;
    displayName: string;
    configured: boolean;
}>;
