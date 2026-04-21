import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { URLSearchParams } from 'url';

import { EhrConnection } from '../entities/ehr-connection.entity';
import { OAuthState } from '../entities/oauth-state.entity';
import { CryptoService } from '../crypto.service';
import { SmartDiscoveryService } from './smart-discovery.service';
import {
  codeChallengeFromVerifier,
  generateCodeVerifier,
  generateState,
} from './pkce.util';
import {
  EhrProvider,
  ProviderConfig,
  getProviderConfig,
} from '../providers/provider-registry';

export interface AuthorizeParams {
  provider: EhrProvider;
  userId: number;
  iss?: string;
  launch?: string;
}

export interface AuthorizeResult {
  redirectUrl: string;
}

interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  patient?: string;
  encounter?: string;
  id_token?: string;
  fhirUser?: string;
}

/**
 * Handles the SMART on FHIR OAuth 2.0 authorization-code + PKCE handshake for
 * every supported EHR provider, plus refresh-token rotation.
 *
 * The same flow works for Epic, Cerner/Oracle Health, Athena, etc.  Provider
 * differences live entirely in the per-provider config resolved by
 * `getProviderConfig`.
 */
@Injectable()
export class SmartAuthService {
  private readonly logger = new Logger(SmartAuthService.name);

  constructor(
    private readonly http: HttpService,
    private readonly discovery: SmartDiscoveryService,
    private readonly crypto: CryptoService,
    @InjectRepository(EhrConnection)
    private readonly connections: Repository<EhrConnection>,
    @InjectRepository(OAuthState)
    private readonly states: Repository<OAuthState>,
  ) {}

  async buildAuthorizeUrl(params: AuthorizeParams): Promise<AuthorizeResult> {
    const config = getProviderConfig(params.provider);
    const fhirBaseUrl = params.iss || config.fhirBaseUrl;

    const { authorizeUrl, tokenUrl } =
      config.authorizeUrl && config.tokenUrl && !params.iss
        ? { authorizeUrl: config.authorizeUrl, tokenUrl: config.tokenUrl }
        : await this.discovery.discover(fhirBaseUrl, {
            authorizeUrl: config.authorizeUrl,
            tokenUrl: config.tokenUrl,
          });

    const codeVerifier = generateCodeVerifier();
    const state = generateState();

    await this.states.save(
      this.states.create({
        state,
        provider: params.provider,
        codeVerifier,
        userId: params.userId,
        fhirBaseUrl,
        authorizeUrl,
        tokenUrl,
        launch: params.launch ?? null,
        redirectUri: config.redirectUri,
        scope: config.scopes,
      }),
    );

    const query = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes,
      state,
      aud: fhirBaseUrl,
      code_challenge: codeChallengeFromVerifier(codeVerifier),
      code_challenge_method: 'S256',
    });
    if (params.launch) {
      query.set('launch', params.launch);
    }

    return { redirectUrl: `${authorizeUrl}?${query.toString()}` };
  }

  async handleCallback(code: string, state: string): Promise<EhrConnection> {
    if (!code || !state) {
      throw new BadRequestException('Missing code or state');
    }
    const stateRow = await this.states.findOne({ where: { state } });
    if (!stateRow) {
      throw new UnauthorizedException('Unknown or expired state');
    }

    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - new Date(stateRow.createdAt).getTime() > TEN_MINUTES) {
      await this.states.delete({ id: stateRow.id });
      throw new UnauthorizedException('OAuth state expired');
    }

    const config = getProviderConfig(stateRow.provider);
    const tokenRes = await this.exchangeToken(config, stateRow.tokenUrl, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: stateRow.redirectUri,
      client_id: config.clientId,
      code_verifier: stateRow.codeVerifier,
    });

    await this.states.delete({ id: stateRow.id });

    return this.upsertConnection(stateRow.userId, stateRow.provider, {
      fhirBaseUrl: stateRow.fhirBaseUrl,
      authorizeUrl: stateRow.authorizeUrl,
      tokenUrl: stateRow.tokenUrl,
      tokenResponse: tokenRes,
    });
  }

  /**
   * Returns a valid access token, refreshing it if within 60 s of expiry.
   */
  async getValidAccessToken(
    userId: number,
    provider: EhrProvider,
  ): Promise<{ connection: EhrConnection; accessToken: string }> {
    const conn = await this.connections.findOne({
      where: { userId, provider },
    });
    if (!conn) {
      throw new NotFoundException(
        `No ${provider} connection found for user`,
      );
    }

    const msUntilExpiry =
      new Date(conn.accessTokenExpiresAt).getTime() - Date.now();
    if (msUntilExpiry > 60_000) {
      return {
        connection: conn,
        accessToken: this.crypto.decrypt(conn.accessTokenEncrypted),
      };
    }

    if (!conn.refreshTokenEncrypted) {
      throw new UnauthorizedException(
        `${provider} access token expired and no refresh token available; user must re-authorize`,
      );
    }

    const config = getProviderConfig(provider);

    let tokenUrl = conn.tokenUrl;
    let authorizeUrl = conn.authorizeUrl;
    if (!tokenUrl || !authorizeUrl) {
      const discovered = await this.discovery.discover(conn.fhirBaseUrl);
      tokenUrl = tokenUrl ?? discovered.tokenUrl;
      authorizeUrl = authorizeUrl ?? discovered.authorizeUrl;
    }

    const refreshToken = this.crypto.decrypt(conn.refreshTokenEncrypted);
    const tokenRes = await this.exchangeToken(config, tokenUrl, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
    }).catch((err) => {
      this.logger.error(`${provider} refresh failed`, err.message);
      throw new UnauthorizedException(
        `${provider} refresh token is no longer valid; user must re-authorize`,
      );
    });

    const updated = await this.upsertConnection(userId, provider, {
      fhirBaseUrl: conn.fhirBaseUrl,
      authorizeUrl,
      tokenUrl,
      tokenResponse: {
        ...tokenRes,
        refresh_token: tokenRes.refresh_token || refreshToken,
      },
    });

    return {
      connection: updated,
      accessToken: this.crypto.decrypt(updated.accessTokenEncrypted),
    };
  }

  async getConnection(
    userId: number,
    provider: EhrProvider,
  ): Promise<EhrConnection | null> {
    return this.connections.findOne({ where: { userId, provider } });
  }

  async listConnectionsForUser(userId: number): Promise<EhrConnection[]> {
    return this.connections.find({ where: { userId } });
  }

  async disconnect(userId: number, provider: EhrProvider): Promise<void> {
    await this.connections.delete({ userId, provider });
  }

  async purgeExpiredStates(): Promise<void> {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    await this.states.delete({ createdAt: LessThan(cutoff) });
  }

  private async exchangeToken(
    config: ProviderConfig,
    tokenUrl: string,
    params: Record<string, string>,
  ): Promise<TokenResponse> {
    const body = new URLSearchParams(params);
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    };
    if (config.clientSecret) {
      const basic = Buffer.from(
        `${config.clientId}:${config.clientSecret}`,
      ).toString('base64');
      headers.Authorization = `Basic ${basic}`;
    }

    const { data } = await firstValueFrom(
      this.http.post<TokenResponse>(tokenUrl, body.toString(), {
        headers,
        timeout: 15_000,
      }),
    );
    return data;
  }

  private async upsertConnection(
    userId: number,
    provider: EhrProvider,
    args: {
      fhirBaseUrl: string;
      authorizeUrl: string;
      tokenUrl: string;
      tokenResponse: TokenResponse;
    },
  ): Promise<EhrConnection> {
    const { fhirBaseUrl, authorizeUrl, tokenUrl, tokenResponse } = args;
    const existing = await this.connections.findOne({
      where: { userId, provider },
    });
    const expiresAt = new Date(
      Date.now() + (tokenResponse.expires_in ?? 3600) * 1000,
    );

    const record: Partial<EhrConnection> = {
      userId,
      provider,
      fhirBaseUrl,
      authorizeUrl,
      tokenUrl,
      patientId: tokenResponse.patient ?? existing?.patientId ?? null,
      encounterId: tokenResponse.encounter ?? existing?.encounterId ?? null,
      fhirUser: tokenResponse.fhirUser ?? existing?.fhirUser ?? null,
      accessTokenEncrypted: this.crypto.encrypt(tokenResponse.access_token),
      refreshTokenEncrypted: tokenResponse.refresh_token
        ? this.crypto.encrypt(tokenResponse.refresh_token)
        : existing?.refreshTokenEncrypted ?? null,
      scope: tokenResponse.scope ?? existing?.scope ?? null,
      tokenType: tokenResponse.token_type ?? 'Bearer',
      accessTokenExpiresAt: expiresAt,
    };

    if (existing) {
      await this.connections.update({ id: existing.id }, record);
      return (await this.connections.findOne({ where: { id: existing.id } }))!;
    }
    return this.connections.save(this.connections.create(record));
  }
}
