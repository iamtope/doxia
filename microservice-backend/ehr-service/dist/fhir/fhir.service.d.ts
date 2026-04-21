import { HttpService } from '@nestjs/axios';
import { SmartAuthService } from '../smart/smart-auth.service';
import type { EhrProvider } from '../providers/provider-registry';
export declare class FhirService {
    private readonly http;
    private readonly auth;
    private readonly logger;
    constructor(http: HttpService, auth: SmartAuthService);
    private request;
    readResource<T = any>(userId: number, provider: EhrProvider, resource: string, id: string): Promise<T>;
    searchResource<T = any>(userId: number, provider: EhrProvider, resource: string, params: Record<string, string | number | undefined>): Promise<T>;
    getPatient(userId: number, provider: EhrProvider, patientId: string): Promise<any>;
    getConditions(userId: number, provider: EhrProvider, patientId: string): Promise<any>;
    getAllergies(userId: number, provider: EhrProvider, patientId: string): Promise<any>;
    getMedications(userId: number, provider: EhrProvider, patientId: string): Promise<any>;
    getVitals(userId: number, provider: EhrProvider, patientId: string): Promise<any>;
    createNoteDocumentReference(userId: number, provider: EhrProvider, args: {
        patientId: string;
        encounterId?: string;
        title: string;
        contentBase64: string;
        contentType?: string;
        loincCode?: string;
        authorReference?: string;
    }): Promise<unknown>;
}
