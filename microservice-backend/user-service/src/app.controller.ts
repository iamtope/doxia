import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Req,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import { GoogleAuthService } from './google-auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('users')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly googleAuth: GoogleAuthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('signup')
  async signup(@Body() signupDto: any) {
    return this.appService.signup(signupDto);
  }

  @Post('login')
  async login(@Body() loginDto: any) {
    return this.appService.login(loginDto);
  }

  @Get('google/authorize')
  googleAuthorize(@Res() res: Response) {
    const url = this.googleAuth.buildAuthorizeUrl();
    return res.redirect(url);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') oauthError: string,
    @Res() res: Response,
  ) {
    const redirectUrl = oauthError
      ? this.googleAuth.buildErrorRedirect(oauthError)
      : await this.googleAuth.handleCallback(code, state);
    return res.redirect(redirectUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Post('notes')
  async saveNote(@Req() req: any, @Body() data: { note: any }) {
    const userId = req.user.sub;
    return this.appService.saveNote(userId, data.note);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('notes/:id')
  async updateNote(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { note: any },
  ) {
    const userId = req.user.sub;
    return this.appService.updateNote(userId, id, data.note);
  }

  @UseGuards(JwtAuthGuard)
  @Get('notes')
  async getMyNotes(@Req() req: any) {
    const userId = req.user.sub;
    return this.appService.getNotes(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('notes/:userId')
  async getNotes(@Req() req: any, @Param('userId') userId: string) {
    if (req.user.sub !== parseInt(userId, 10)) {
      return this.appService.getNotes(req.user.sub);
    }
    return this.appService.getNotes(parseInt(userId, 10));
  }

  @MessagePattern('user.signup')
  async handleSignup(@Payload() data: any) {
    return this.appService.signup(data);
  }

  @MessagePattern('user.login')
  async handleLogin(@Payload() data: any) {
    return this.appService.login(data);
  }
}
