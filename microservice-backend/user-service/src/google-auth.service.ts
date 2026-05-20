import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { randomBytes } from 'crypto';
import { URLSearchParams } from 'url';
import { AppService } from './app.service';

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  token_type?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
}

@Injectable()
export class GoogleAuthService {
  /** state -> expiresAt (ms) */
  private readonly pendingStates = new Map<string, number>();

  constructor(
    private readonly http: HttpService,
    private readonly appService: AppService,
  ) {}

  private get clientId(): string {
    const id = process.env.GOOGLE_CLIENT_ID;
    if (!id) {
      throw new BadRequestException('Google OAuth is not configured');
    }
    return id;
  }

  private get clientSecret(): string {
    const secret = process.env.GOOGLE_CLIENT_SECRET;
    if (!secret) {
      throw new BadRequestException('Google OAuth is not configured');
    }
    return secret;
  }

  private get redirectUri(): string {
    return (
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:3003/auth/google/callback'
    );
  }

  private get frontendCallbackUrl(): string {
    return (
      process.env.AUTH_FRONTEND_CALLBACK_URL ||
      'http://localhost:3000/auth/callback'
    );
  }

  private pruneExpiredStates() {
    const now = Date.now();
    for (const [state, expiresAt] of this.pendingStates) {
      if (expiresAt <= now) this.pendingStates.delete(state);
    }
  }

  private registerState(): string {
    this.pruneExpiredStates();
    const state = randomBytes(24).toString('hex');
    this.pendingStates.set(state, Date.now() + 10 * 60 * 1000);
    return state;
  }

  private consumeState(state: string | undefined): boolean {
    if (!state) return false;
    const expiresAt = this.pendingStates.get(state);
    this.pendingStates.delete(state);
    return Boolean(expiresAt && expiresAt > Date.now());
  }

  buildErrorRedirect(message: string): string {
    const base = new URL(this.frontendCallbackUrl);
    base.searchParams.set('error', message.slice(0, 200));
    return base.toString();
  }

  buildAuthorizeUrl(): string {
    const state = this.registerState();
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private async exchangeCode(code: string): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await firstValueFrom(
      this.http.post<GoogleTokenResponse>(
        'https://oauth2.googleapis.com/token',
        body.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      ),
    );
    const data = tokenResponse.data;

    if (!data?.access_token) {
      throw new UnauthorizedException('Google token exchange failed');
    }
    return data;
  }

  private async fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const profileResponse = await firstValueFrom(
      this.http.get<GoogleUserInfo>(
        'https://openidconnect.googleapis.com/v1/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      ),
    );
    const data = profileResponse.data;

    if (!data?.sub || !data?.email) {
      throw new UnauthorizedException('Incomplete Google profile');
    }
    return data;
  }

  async handleCallback(code: string | undefined, state: string | undefined): Promise<string> {
    const base = new URL(this.frontendCallbackUrl);

    if (!code) {
      base.searchParams.set('error', 'missing_code');
      return base.toString();
    }

    if (!this.consumeState(state)) {
      base.searchParams.set('error', 'invalid_state');
      return base.toString();
    }

    try {
      const tokens = await this.exchangeCode(code);
      const profile = await this.fetchUserInfo(tokens.access_token);
      const auth = await this.appService.authenticateGoogleUser(profile);

      base.searchParams.set('access_token', auth.access_token);
      base.searchParams.set('user', JSON.stringify(auth.user));
      return base.toString();
    } catch (err: any) {
      const message =
        err?.response?.data?.error_description ||
        err?.message ||
        'google_auth_failed';
      base.searchParams.set('error', String(message).slice(0, 200));
      return base.toString();
    }
  }
}
