import { Controller, Post, Body, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

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

  @Post('notes')
  async saveNote(@Body() data: { userId: number; note: any }) {
    return this.appService.saveNote(data.userId, data.note);
  }

  @Get('notes/:userId')
  async getNotes(@Payload() userId: number) {
    // Note: In a real app, this would use the JWT user ID
    return this.appService.getNotes(userId);
  }

  // RabbitMQ handlers for cross-service communication
  @MessagePattern('user.signup')
  async handleSignup(@Payload() data: any) {
    return this.appService.signup(data);
  }

  @MessagePattern('user.login')
  async handleLogin(@Payload() data: any) {
    return this.appService.login(data);
  }
}
