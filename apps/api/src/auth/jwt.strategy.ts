import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.['auth_token'] || null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'nexaloop-jwt-secret-change-in-production',
    });
  }

  async validate(payload: { sub: string; email: string; orgId: string }) {
    if (!payload.sub || !payload.email || !payload.orgId) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, email: payload.email, orgId: payload.orgId };
  }
}
