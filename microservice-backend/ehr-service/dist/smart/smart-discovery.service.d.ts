import { HttpService } from '@nestjs/axios';
export interface SmartEndpoints {
    authorizeUrl: string;
    tokenUrl: string;
}
export declare class SmartDiscoveryService {
    private readonly http;
    private readonly logger;
    private readonly cache;
    constructor(http: HttpService);
    discover(fhirBaseUrl: string, overrides?: {
        authorizeUrl?: string;
        tokenUrl?: string;
    }): Promise<SmartEndpoints>;
}
