import {
  Injectable,
  Logger,
  BadGatewayException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { AxiosRequestConfig } from 'axios';

import { SmartAuthService } from '../smart/smart-auth.service';
import type { EhrProvider } from '../providers/provider-registry';

/**
 * Thin wrapper over a SMART on FHIR R4 REST API (Epic, Cerner, etc.).
 *
 * Every call pulls a valid (auto-refreshed) access token from SmartAuthService
 * scoped to the user + provider, and targets the FHIR base URL stored on that
 * provider's connection row for the user.
 */
@Injectable()
export class FhirService {
  private readonly logger = new Logger(FhirService.name);

  constructor(
    private readonly http: HttpService,
    private readonly auth: SmartAuthService,
  ) {}

  private async request<T>(
    userId: number,
    provider: EhrProvider,
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    options: {
      body?: any;
      contentType?: string;
      accept?: string;
      params?: Record<string, string | number | undefined>;
    } = {},
  ): Promise<T> {
    const { connection, accessToken } = await this.auth.getValidAccessToken(
      userId,
      provider,
    );
    const url = `${connection.fhirBaseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

    const cleanParams: Record<string, string> = {};
    if (options.params) {
      for (const [k, v] of Object.entries(options.params)) {
        if (v !== undefined && v !== null && v !== '') cleanParams[k] = String(v);
      }
    }

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: options.accept || 'application/fhir+json',
        ...(options.body
          ? { 'Content-Type': options.contentType || 'application/fhir+json' }
          : {}),
      },
      params: Object.keys(cleanParams).length ? cleanParams : undefined,
      data: options.body,
      timeout: 20_000,
    };

    try {
      const { data } = await firstValueFrom(this.http.request<T>(config));
      return data;
    } catch (err: any) {
      const status = err?.response?.status;
      const body = err?.response?.data;
      this.logger.error(
        `${provider} FHIR ${method} ${path} failed: status=${status} body=${JSON.stringify(body)}`,
      );
      if (status === 404) {
        throw new NotFoundException(`${provider} FHIR resource not found: ${path}`);
      }
      throw new BadGatewayException(
        `${provider} FHIR request failed${status ? ` (status ${status})` : ''}`,
      );
    }
  }

  async readResource<T = any>(
    userId: number,
    provider: EhrProvider,
    resource: string,
    id: string,
  ): Promise<T> {
    return this.request<T>(
      userId,
      provider,
      'GET',
      `${resource}/${encodeURIComponent(id)}`,
    );
  }

  async searchResource<T = any>(
    userId: number,
    provider: EhrProvider,
    resource: string,
    params: Record<string, string | number | undefined>,
  ): Promise<T> {
    return this.request<T>(userId, provider, 'GET', resource, { params });
  }

  async getPatient(userId: number, provider: EhrProvider, patientId: string) {
    return this.readResource(userId, provider, 'Patient', patientId);
  }

  async getConditions(userId: number, provider: EhrProvider, patientId: string) {
    return this.searchResource(userId, provider, 'Condition', {
      patient: patientId,
      category: 'problem-list-item',
    });
  }

  async getAllergies(userId: number, provider: EhrProvider, patientId: string) {
    return this.searchResource(userId, provider, 'AllergyIntolerance', {
      patient: patientId,
    });
  }

  async getMedications(userId: number, provider: EhrProvider, patientId: string) {
    return this.searchResource(userId, provider, 'MedicationRequest', {
      patient: patientId,
      status: 'active',
    });
  }

  async getVitals(userId: number, provider: EhrProvider, patientId: string) {
    return this.searchResource(userId, provider, 'Observation', {
      patient: patientId,
      category: 'vital-signs',
    });
  }

  /**
   * Push a DocumentReference (clinical note) back to the EHR.
   *
   * Works against both Epic and Cerner R4, though Cerner is stricter about
   * requiring `context.encounter` + `author` in production tenants.
   */
  async createNoteDocumentReference(
    userId: number,
    provider: EhrProvider,
    args: {
      patientId: string;
      encounterId?: string;
      title: string;
      contentBase64: string;
      contentType?: string;
      loincCode?: string;
      authorReference?: string;
    },
  ) {
    const documentReference = {
      resourceType: 'DocumentReference',
      status: 'current',
      docStatus: 'preliminary',
      type: {
        coding: [
          {
            system: 'http://loinc.org',
            code: args.loincCode || '11506-3',
            display: 'Progress note',
          },
        ],
      },
      subject: { reference: `Patient/${args.patientId}` },
      date: new Date().toISOString(),
      description: args.title,
      ...(args.authorReference
        ? { author: [{ reference: args.authorReference }] }
        : {}),
      content: [
        {
          attachment: {
            contentType: args.contentType || 'text/plain',
            data: args.contentBase64,
            title: args.title,
          },
        },
      ],
      ...(args.encounterId
        ? {
            context: {
              encounter: [{ reference: `Encounter/${args.encounterId}` }],
            },
          }
        : {}),
    };

    return this.request(userId, provider, 'POST', 'DocumentReference', {
      body: documentReference,
    });
  }
}
