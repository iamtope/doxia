import { HttpService } from '@nestjs/axios';
import { AppService } from './app.service';
export declare class GoogleAuthService {
    private readonly http;
    private readonly appService;
    private readonly pendingStates;
    constructor(http: HttpService, appService: AppService);
    private get clientId();
    private get clientSecret();
    private get redirectUri();
    private get frontendCallbackUrl();
    private pruneExpiredStates;
    private registerState;
    private consumeState;
    buildErrorRedirect(message: string): string;
    buildAuthorizeUrl(): string;
    private exchangeCode;
    private fetchUserInfo;
    handleCallback(code: string | undefined, state: string | undefined): Promise<string>;
}
