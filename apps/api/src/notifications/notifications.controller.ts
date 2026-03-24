import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrg } from '../auth/current-org.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentOrg() orgId: string,
    @CurrentUser() userId: string,
    @Query('unread') unread?: string,
  ) {
    return this.notificationsService.listForUser(
      orgId,
      userId,
      unread === 'true',
    );
  }

  @Get('count')
  async unreadCount(
    @CurrentOrg() orgId: string,
    @CurrentUser() userId: string,
  ) {
    const count = await this.notificationsService.unreadCount(orgId, userId);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(
    @CurrentOrg() orgId: string,
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markRead(orgId, userId, id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(
    @CurrentOrg() orgId: string,
    @CurrentUser() userId: string,
  ) {
    return this.notificationsService.markAllRead(orgId, userId);
  }
}
