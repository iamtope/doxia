import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { EhrConnection } from '../entities/ehr-connection.entity';
import { OAuthState } from '../entities/oauth-state.entity';
import { CryptoService } from '../crypto.service';
import { SmartDiscoveryService } from './smart-discovery.service';
import { EhrProvider } from '../providers/provider-registry';
export interface AuthorizeParams {
    provider: EhrProvider;
    userId: number;
    iss?: string;
    launch?: string;
}
export interface AuthorizeResult {
    redirectUrl: string;
}
export declare class SmartAuthService {
    private readonly http;
    private readonly discovery;
    private readonly crypto;
    private readonly connections;
    private readonly states;
    private readonly logger;
    constructor(http: HttpService, discovery: SmartDiscoveryService, crypto: CryptoService, connections: Repository<EhrConnection>, states: Repository<OAuthState>);
    buildAuthorizeUrl(params: AuthorizeParams): Promise<AuthorizeResult>;
    handleCallback(code: string, state: string): Promise<EhrConnection>;
    getValidAccessToken(userId: number, provider: EhrProvider): Promise<{
        connection: EhrConnection;
        accessToken: string;
    }>;
    getConnection(userId: number, provider: EhrProvider): Promise<EhrConnection | null>;
    listConnectionsForUser(userId: number): Promise<EhrConnection[]>;
    disconnect(userId: number, provider: EhrProvider): Promise<void>;
    purgeExpiredStates(): Promise<void>;
    private exchangeToken;
    private upsertConnection;
}
