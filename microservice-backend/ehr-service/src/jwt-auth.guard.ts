import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header = request.headers['authorization'];
    const queryToken = request.query?.token as string | undefined;

    let token: string | undefined;
    if (header && header.startsWith('Bearer ')) {
      token = header.slice('Bearer '.length);
    } else if (queryToken) {
      token = queryToken;
    }

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
