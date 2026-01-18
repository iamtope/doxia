import { Controller, Post, Body, Inject, Get } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller()
export class AppController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Get()
  getHello() {
    return { message: 'API Gateway is running' };
  }

  @Post('auth/signup')
  async signup(@Body() signupDto: any) {
    return firstValueFrom(this.authClient.send('auth.signup', signupDto));
  }

  @Post('auth/login')
  async login(@Body() loginDto: any) {
    return firstValueFrom(this.authClient.send('auth.login', loginDto));
  }
}
