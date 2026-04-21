import {
  All,
  Controller,
  HttpException,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { Request, Response } from 'express';

/**
 * Transparent proxy from /ehr/* on the gateway to EHR_SERVICE_URL/*.
 *
 * Redirects (302) from the EHR service (authorize + callback) are forwarded
 * verbatim to the browser so the SMART on FHIR redirect handshake still works
 * end-to-end when the frontend only talks to the gateway.
 */
@Controller('ehr')
export class EhrGatewayController {
  private readonly EHR_SERVICE_URL =
    process.env.EHR_SERVICE_URL || 'http://ehr-service:3004/ehr';

  constructor(private readonly httpService: HttpService) {}

  @All('*splat')
  async proxy(@Req() req: Request, @Res() res: Response) {
    const suffix = req.url.replace(/^\/*/, '');
    const target = `${this.EHR_SERVICE_URL.replace(/\/+$/, '')}/${suffix}`;

    const forwardHeaders: Record<string, string> = {};
    if (req.headers['authorization']) {
      forwardHeaders['authorization'] = String(req.headers['authorization']);
    }
    if (req.headers['content-type']) {
      forwardHeaders['content-type'] = String(req.headers['content-type']);
    }
    if (req.headers['accept']) {
      forwardHeaders['accept'] = String(req.headers['accept']);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: req.method as any,
          url: target,
          headers: forwardHeaders,
          data: ['GET', 'HEAD', 'DELETE'].includes(req.method) ? undefined : req.body,
          maxRedirects: 0,
          validateStatus: () => true,
        }),
      );

      if (response.status >= 300 && response.status < 400 && response.headers.location) {
        return res.redirect(response.status, response.headers.location);
      }

      const contentType = response.headers['content-type'];
      if (contentType) res.setHeader('content-type', contentType);
      return res.status(response.status).send(response.data);
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(
          error.response.data || 'EHR service error',
          error.response.status || HttpStatus.BAD_GATEWAY,
        );
      }
      throw new HttpException('EHR gateway error', HttpStatus.BAD_GATEWAY);
    }
  }
}
