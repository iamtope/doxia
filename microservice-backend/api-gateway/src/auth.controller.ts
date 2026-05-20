import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  HttpException,
  HttpStatus,
  Param,
  Req,
  Res,
  Headers,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { Request, Response } from 'express';

@Controller('auth')
export class UserController {
  private readonly USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3002/users';

  constructor(private readonly httpService: HttpService) {}

  private handleError(error: any) {
    if (error.response) {
      throw new HttpException(
        error.response.data || 'Internal Service Error',
        error.response.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
    throw new HttpException(
      'Internal Gateway Error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  private authHeaders(authorization?: string) {
    return authorization ? { Authorization: authorization } : {};
  }

  @Post('signup')
  async signup(@Body() signupDto: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.USER_SERVICE_URL}/signup`, signupDto)
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post('login')
  async login(@Body() loginDto: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.USER_SERVICE_URL}/login`, loginDto)
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('google')
  async googleAuthorize(@Res() res: Response) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.USER_SERVICE_URL}/google/authorize`, {
          maxRedirects: 0,
          validateStatus: () => true,
        }),
      );
      const location =
        response.headers?.location ||
        response.headers?.Location;
      if (response.status >= 300 && response.status < 400 && location) {
        return res.redirect(response.status, String(location));
      }
      throw new HttpException(
        response.data || 'Google authorize failed',
        response.status || HttpStatus.BAD_GATEWAY,
      );
    } catch (error: any) {
      const loc =
        error.response?.headers?.location ||
        error.response?.headers?.Location;
      if (loc) {
        return res.redirect(error.response.status, String(loc));
      }
      this.handleError(error);
    }
  }

  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const qs = req.url.includes('?') ? req.url.split('?')[1] : '';
    const target = `${this.USER_SERVICE_URL}/google/callback${qs ? `?${qs}` : ''}`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(target, {
          maxRedirects: 0,
          validateStatus: () => true,
        }),
      );
      if (response.status >= 300 && response.status < 400 && response.headers.location) {
        return res.redirect(response.status, response.headers.location);
      }
      throw new HttpException('Google callback failed', HttpStatus.BAD_GATEWAY);
    } catch (error: any) {
      if (error.response?.status >= 300 && error.response?.status < 400 && error.response?.headers?.location) {
        return res.redirect(error.response.status, error.response.headers.location);
      }
      this.handleError(error);
    }
  }

  @Post('notes')
  async saveNote(@Body() noteData: any, @Headers('authorization') auth?: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.USER_SERVICE_URL}/notes`, noteData, {
          headers: this.authHeaders(auth),
        })
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch('notes/:id')
  async updateNote(
    @Param('id') id: string,
    @Body() noteData: any,
    @Headers('authorization') auth?: string,
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`${this.USER_SERVICE_URL}/notes/${id}`, noteData, {
          headers: this.authHeaders(auth),
        })
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('notes/:userId')
  async getNotes(@Param('userId') userId: string, @Headers('authorization') auth?: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.USER_SERVICE_URL}/notes/${userId}`, {
          headers: this.authHeaders(auth),
        })
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('hello')
  async getHello() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.USER_SERVICE_URL}`)
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

