import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UserController } from './auth.controller';
import { EhrGatewayController } from './ehr.controller';

@Module({
  imports: [HttpModule],
  controllers: [UserController, EhrGatewayController],
})
export class AppModule { }
