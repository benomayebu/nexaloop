import { Controller, Post, Get, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { CurrentOrg } from './current-org.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; orgName: string; name?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(
      body.email,
      body.password,
      body.orgName,
      body.name,
    );
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { token: result.token, user: result.user, org: result.org };
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body.email, body.password);
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { token: result.token, user: result.user, org: result.org };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(
    @CurrentUser() userId: string,
    @CurrentOrg() orgId: string,
  ) {
    return this.authService.getMe(userId, orgId);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth_token');
    return { success: true };
  }
}
