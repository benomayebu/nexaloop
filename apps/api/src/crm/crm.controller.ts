import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrg } from '../auth/current-org.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CrmThreadStatus, CrmTaskStatus } from '@prisma/client';

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ─── Stats ────────────────────────────────────────────────────────

  @Get('stats')
  stats(@CurrentOrg() orgId: string) {
    return this.crmService.stats(orgId);
  }

  // ─── Threads ──────────────────────────────────────────────────────

  @Get('threads')
  listThreads(
    @CurrentOrg() orgId: string,
    @Query('status') status?: CrmThreadStatus,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.crmService.listThreads(orgId, { status, supplierId });
  }

  @Post('threads')
  createThread(
    @CurrentOrg() orgId: string,
    @CurrentUser() userId: string,
    @Body() dto: CreateThreadDto,
  ) {
    return this.crmService.createThread(orgId, userId, dto);
  }

  @Get('threads/:id')
  getThread(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.crmService.getThread(orgId, id);
  }

  @Post('threads/:id/messages')
  addMessage(
    @CurrentOrg() orgId: string,
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.crmService.addMessage(orgId, userId, id, dto);
  }

  @Put('threads/:id/resolve')
  resolveThread(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.crmService.resolveThread(orgId, id);
  }

  @Put('threads/:id/reopen')
  reopenThread(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.crmService.reopenThread(orgId, id);
  }

  // ─── Tasks ────────────────────────────────────────────────────────

  @Get('tasks')
  listTasks(
    @CurrentOrg() orgId: string,
    @Query('status') status?: CrmTaskStatus,
    @Query('assigneeId') assigneeId?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.crmService.listTasks(orgId, { status, assigneeId, supplierId });
  }

  @Post('tasks')
  createTask(@CurrentOrg() orgId: string, @Body() dto: CreateTaskDto) {
    return this.crmService.createTask(orgId, dto);
  }

  @Put('tasks/:id')
  updateTask(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.crmService.updateTask(orgId, id, dto);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTask(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.crmService.deleteTask(orgId, id);
  }

  // ─── Pipeline ─────────────────────────────────────────────────────

  @Get('pipeline')
  pipeline(@CurrentOrg() orgId: string) {
    return this.crmService.pipeline(orgId);
  }

  // ─── Activity ─────────────────────────────────────────────────────

  @Get('activity')
  activity(@CurrentOrg() orgId: string) {
    return this.crmService.activity(orgId);
  }

  // ─── Team ─────────────────────────────────────────────────────────

  @Get('team')
  teamMembers(@CurrentOrg() orgId: string) {
    return this.crmService.teamMembers(orgId);
  }
}
