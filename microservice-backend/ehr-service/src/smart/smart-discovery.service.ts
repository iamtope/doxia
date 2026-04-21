import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface SmartEndpoints {
  authorizeUrl: string;
  tokenUrl: string;
}

/**
 * Resolves the OAuth2 authorize/token endpoints for a FHIR server.
 *
 * Priority order:
 *   1. `overrides` arg (e.g. provider config from env).
 *   2. /.well-known/smart-configuration on the FHIR base URL.
 *   3. CapabilityStatement (/metadata) SMART security extensions.
 */
@Injectable()
export class SmartDiscoveryService {
  private readonly logger = new Logger(SmartDiscoveryService.name);
  private readonly cache = new Map<string, SmartEndpoints>();

  constructor(private readonly http: HttpService) {}

  async discover(
    fhirBaseUrl: string,
    overrides?: { authorizeUrl?: string; tokenUrl?: string },
  ): Promise<SmartEndpoints> {
    const base = fhirBaseUrl.replace(/\/+$/, '');

    if (overrides?.authorizeUrl && overrides?.tokenUrl) {
      return {
        authorizeUrl: overrides.authorizeUrl,
        tokenUrl: overrides.tokenUrl,
      };
    }

    if (this.cache.has(base)) {
      const cached = this.cache.get(base)!;
      return {
        authorizeUrl: overrides?.authorizeUrl ?? cached.authorizeUrl,
        tokenUrl: overrides?.tokenUrl ?? cached.tokenUrl,
      };
    }

    try {
      const { data } = await firstValueFrom(
        this.http.get(`${base}/.well-known/smart-configuration`, {
          headers: { Accept: 'application/json' },
          timeout: 10_000,
        }),
      );
      if (data?.authorization_endpoint && data?.token_endpoint) {
        const endpoints: SmartEndpoints = {
          authorizeUrl: overrides?.authorizeUrl ?? data.authorization_endpoint,
          tokenUrl: overrides?.tokenUrl ?? data.token_endpoint,
        };
        this.cache.set(base, {
          authorizeUrl: data.authorization_endpoint,
          tokenUrl: data.token_endpoint,
        });
        return endpoints;
      }
    } catch (err: any) {
      this.logger.warn(
        `smart-configuration lookup failed for ${base}: ${err.message}`,
      );
    }

    try {
      const { data } = await firstValueFrom(
        this.http.get(`${base}/metadata`, {
          headers: { Accept: 'application/fhir+json' },
          timeout: 10_000,
        }),
      );
      const security = data?.rest?.[0]?.security?.extension?.find(
        (e: any) =>
          e.url ===
          'http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris',
      );
      const authorizeUrl = security?.extension?.find(
        (e: any) => e.url === 'authorize',
      )?.valueUri;
      const tokenUrl = security?.extension?.find((e: any) => e.url === 'token')
        ?.valueUri;
      if (authorizeUrl && tokenUrl) {
        this.cache.set(base, { authorizeUrl, tokenUrl });
        return {
          authorizeUrl: overrides?.authorizeUrl ?? authorizeUrl,
          tokenUrl: overrides?.tokenUrl ?? tokenUrl,
        };
      }
    } catch (err: any) {
      this.logger.warn(`CapabilityStatement lookup failed for ${base}: ${err.message}`);
    }

    throw new BadGatewayException(
      `Could not discover SMART on FHIR endpoints for ${base}`,
    );
  }
}
