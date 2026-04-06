import { Controller, Post, Body, Get, UseGuards, Req, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('users')
export class AppController {
  constructor(private readonly appService: AppService) {}

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

  @UseGuards(JwtAuthGuard)
  @Post('notes')
  async saveNote(@Req() req: any, @Body() data: { note: any }) {
    const userId = req.user.sub;
    return this.appService.saveNote(userId, data.note);
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
