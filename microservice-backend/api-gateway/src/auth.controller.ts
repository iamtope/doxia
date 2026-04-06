import { Controller, Post, Body, Get, HttpException, HttpStatus, Param, Req, Headers } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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

