import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { SmartAuthService } from './smart/smart-auth.service';
import { FhirService } from './fhir/fhir.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  EhrProvider,
  SUPPORTED_PROVIDERS,
  listProviders,
} from './providers/provider-registry';

/**
 * Routes under /ehr:
 *
 *   GET    /ehr/health
 *   GET    /ehr/providers                              - public; which providers are configured
 *   GET    /ehr/connections                            - (JWT) list all of the user's EHR connections
 *   GET    /ehr/:provider/authorize                    - (JWT; ?token= ok) 302 to provider authorize
 *   GET    /ehr/:provider/launch?iss=&launch=          - (JWT; ?token= ok) EHR launch entry
 *   GET    /ehr/:provider/callback?code=&state=        - public OAuth callback (state-verified)
 *   GET    /ehr/:provider/connection                   - (JWT) status for a single provider
 *   DELETE /ehr/:provider/connection                   - (JWT)
 *   GET    /ehr/:provider/patient/:id                  - (JWT)
 *   GET    /ehr/:provider/patient/:id/conditions       - (JWT)
 *   GET    /ehr/:provider/patient/:id/allergies        - (JWT)
 *   GET    /ehr/:provider/patient/:id/medications      - (JWT)
 *   GET    /ehr/:provider/patient/:id/vitals           - (JWT)
 *   POST   /ehr/:provider/patient/:id/document         - (JWT) push a DocumentReference
 */
@Controller('ehr')
export class EhrController {
  constructor(
    private readonly auth: SmartAuthService,
    private readonly fhir: FhirService,
  ) {}

  @Get('health')
  health() {
    return { ok: true, service: 'ehr-service' };
  }

  @Get('providers')
  providers() {
    return { providers: listProviders() };
  }

  @UseGuards(JwtAuthGuard)
  @Get('connections')
  async connections(@Req() req: any) {
    const rows = await this.auth.listConnectionsForUser(req.user.sub);
    return {
      connections: rows.map((r) => ({
        provider: r.provider,
        fhirBaseUrl: r.fhirBaseUrl,
        patientId: r.patientId,
        encounterId: r.encounterId,
        fhirUser: r.fhirUser,
        scope: r.scope,
        accessTokenExpiresAt: r.accessTokenExpiresAt,
      })),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':provider/authorize')
  async authorize(
    @Req() req: any,
    @Res() res: Response,
    @Param('provider') provider: string,
    @Query('iss') iss?: string,
    @Query('launch') launch?: string,
  ) {
    const p = this.assertProvider(provider);
    const { redirectUrl } = await this.auth.buildAuthorizeUrl({
      provider: p,
      userId: req.user.sub,
      iss,
      launch,
    });
    return res.redirect(redirectUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':provider/launch')
  async launch(
    @Req() req: any,
    @Res() res: Response,
    @Param('provider') provider: string,
    @Query('iss') iss?: string,
    @Query('launch') launch?: string,
  ) {
    if (!iss) {
      throw new BadRequestException('EHR launch requires iss parameter');
    }
    const p = this.assertProvider(provider);
    const { redirectUrl } = await this.auth.buildAuthorizeUrl({
      provider: p,
      userId: req.user.sub,
      iss,
      launch,
    });
    return res.redirect(redirectUrl);
  }

  @Get(':provider/callback')
  async callback(
    @Res() res: Response,
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
  ) {
    this.assertProvider(provider);
    const successUrl =
      process.env.EHR_FRONTEND_SUCCESS_URL ||
      `http://localhost:3000/dashboard/integrations?ehr=connected&provider=${provider}`;
    const errorUrl =
      process.env.EHR_FRONTEND_ERROR_URL ||
      `http://localhost:3000/dashboard/integrations?ehr=error&provider=${provider}`;

    if (error) {
      const msg = encodeURIComponent(errorDescription || error);
      return res.redirect(`${errorUrl}&message=${msg}`);
    }

    try {
      await this.auth.handleCallback(code, state);
      return res.redirect(successUrl);
    } catch (err: any) {
      const msg = encodeURIComponent(err.message || 'EHR connect failed');
      return res.redirect(`${errorUrl}&message=${msg}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':provider/connection')
  async getConnection(
    @Req() req: any,
    @Param('provider') provider: string,
  ) {
    const p = this.assertProvider(provider);
    const conn = await this.auth.getConnection(req.user.sub, p);
    if (!conn) return { connected: false, provider: p };
    return {
      connected: true,
      provider: p,
      fhirBaseUrl: conn.fhirBaseUrl,
      patientId: conn.patientId,
      encounterId: conn.encounterId,
      fhirUser: conn.fhirUser,
      scope: conn.scope,
      accessTokenExpiresAt: conn.accessTokenExpiresAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':provider/connection')
  async disconnect(
    @Req() req: any,
    @Param('provider') provider: string,
  ) {
    const p = this.assertProvider(provider);
    await this.auth.disconnect(req.user.sub, p);
    return { ok: true, provider: p };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':provider/patient/:id')
  async getPatient(
    @Req() req: any,
    @Param('provider') provider: string,
    @Param('id') id: string,
  ) {
    const p = this.assertProvider(provider);
    return this.fhir.getPatient(req.user.sub, p, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':provider/patient/:id/conditions')
  async getConditions(
    @Req() req: any,
    @Param('provider') provider: string,
    @Param('id') id: string,
  ) {
    const p = this.assertProvider(provider);
    return this.fhir.getConditions(req.user.sub, p, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':provider/patient/:id/allergies')
  async getAllergies(
    @Req() req: any,
    @Param('provider') provider: string,
    @Param('id') id: string,
  ) {
    const p = this.assertProvider(provider);
    return this.fhir.getAllergies(req.user.sub, p, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':provider/patient/:id/medications')
  async getMedications(
    @Req() req: any,
    @Param('provider') provider: string,
    @Param('id') id: string,
  ) {
    const p = this.assertProvider(provider);
    return this.fhir.getMedications(req.user.sub, p, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':provider/patient/:id/vitals')
  async getVitals(
    @Req() req: any,
    @Param('provider') provider: string,
    @Param('id') id: string,
  ) {
    const p = this.assertProvider(provider);
    return this.fhir.getVitals(req.user.sub, p, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':provider/patient/:id/document')
  async postDocument(
    @Req() req: any,
    @Param('provider') provider: string,
    @Param('id') patientId: string,
    @Body()
    body: {
      title: string;
      content: string;
      contentType?: string;
      loincCode?: string;
      encounterId?: string;
      authorReference?: string;
    },
  ) {
    const p = this.assertProvider(provider);
    if (!body?.title || !body?.content) {
      throw new BadRequestException('title and content are required');
    }
    const contentBase64 = Buffer.from(body.content, 'utf8').toString('base64');
    return this.fhir.createNoteDocumentReference(req.user.sub, p, {
      patientId,
      encounterId: body.encounterId,
      title: body.title,
      contentBase64,
      contentType: body.contentType,
      loincCode: body.loincCode,
      authorReference: body.authorReference,
    });
  }

  private assertProvider(provider: string): EhrProvider {
    if (!SUPPORTED_PROVIDERS.includes(provider as EhrProvider)) {
      throw new BadRequestException(
        `Unsupported EHR provider '${provider}'. Supported: ${SUPPORTED_PROVIDERS.join(', ')}`,
      );
    }
    return provider as EhrProvider;
  }
}
