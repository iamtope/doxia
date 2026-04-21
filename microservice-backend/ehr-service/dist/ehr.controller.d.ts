import type { Response } from 'express';
import { SmartAuthService } from './smart/smart-auth.service';
import { FhirService } from './fhir/fhir.service';
import { EhrProvider } from './providers/provider-registry';
export declare class EhrController {
    private readonly auth;
    private readonly fhir;
    constructor(auth: SmartAuthService, fhir: FhirService);
    health(): {
        ok: boolean;
        service: string;
    };
    providers(): {
        providers: {
            provider: EhrProvider;
            displayName: string;
            configured: boolean;
        }[];
    };
    connections(req: any): Promise<{
        connections: {
            provider: EhrProvider;
            fhirBaseUrl: string;
            patientId: string | null;
            encounterId: string | null;
            fhirUser: string | null;
            scope: string | null;
            accessTokenExpiresAt: Date;
        }[];
    }>;
    authorize(req: any, res: Response, provider: string, iss?: string, launch?: string): Promise<void>;
    launch(req: any, res: Response, provider: string, iss?: string, launch?: string): Promise<void>;
    callback(res: Response, provider: string, code: string, state: string, error?: string, errorDescription?: string): Promise<void>;
    getConnection(req: any, provider: string): Promise<{
        connected: boolean;
        provider: EhrProvider;
        fhirBaseUrl?: undefined;
        patientId?: undefined;
        encounterId?: undefined;
        fhirUser?: undefined;
        scope?: undefined;
        accessTokenExpiresAt?: undefined;
    } | {
        connected: boolean;
        provider: EhrProvider;
        fhirBaseUrl: string;
        patientId: string | null;
        encounterId: string | null;
        fhirUser: string | null;
        scope: string | null;
        accessTokenExpiresAt: Date;
    }>;
    disconnect(req: any, provider: string): Promise<{
        ok: boolean;
        provider: EhrProvider;
    }>;
    getPatient(req: any, provider: string, id: string): Promise<any>;
    getConditions(req: any, provider: string, id: string): Promise<any>;
    getAllergies(req: any, provider: string, id: string): Promise<any>;
    getMedications(req: any, provider: string, id: string): Promise<any>;
    getVitals(req: any, provider: string, id: string): Promise<any>;
    postDocument(req: any, provider: string, patientId: string, body: {
        title: string;
        content: string;
        contentType?: string;
        loincCode?: string;
        encounterId?: string;
        authorReference?: string;
    }): Promise<unknown>;
    private assertProvider;
}
