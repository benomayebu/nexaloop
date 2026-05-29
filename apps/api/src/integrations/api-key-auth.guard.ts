import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';

/**
 * Guard that authenticates requests via API key in the
 * Authorization header: `Bearer nxa_...`
 *
 * Sets `req.orgId` on success so downstream handlers can
 * use the same @CurrentOrg() decorator.
 */
@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer nxa_')) {
      throw new UnauthorizedException('Missing or invalid API key');
    }

    const rawKey = authHeader.replace('Bearer ', '');
    const orgId = await this.apiKeyService.validate(rawKey);

    if (!orgId) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    // Attach orgId to the request so @CurrentOrg() works
    request.orgId = orgId;
    return true;
  }
}
