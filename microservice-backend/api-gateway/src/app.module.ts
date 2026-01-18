import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UserController } from './auth.controller';

@Module({
  imports: [HttpModule],
  controllers: [UserController],
})
export class AppModule { }
