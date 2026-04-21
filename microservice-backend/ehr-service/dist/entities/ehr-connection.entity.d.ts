import type { EhrProvider } from '../providers/provider-registry';
export declare class EhrConnection {
    id: number;
    userId: number;
    provider: EhrProvider;
    fhirBaseUrl: string;
    authorizeUrl: string | null;
    tokenUrl: string | null;
    patientId: string | null;
    encounterId: string | null;
    fhirUser: string | null;
    accessTokenEncrypted: string;
    refreshTokenEncrypted: string | null;
    scope: string | null;
    tokenType: string | null;
    accessTokenExpiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
