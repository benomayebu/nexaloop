import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentOrg } from '../auth/current-org.decorator';
import { UpdateOrgDto } from './dto/update-org.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ── Organisation ─────────────────────────────────────────────────

  /** GET /settings/org */
  @Get('org')
  getOrg(@CurrentOrg() orgId: string) {
    return this.settingsService.getOrg(orgId);
  }

  /** PATCH /settings/org */
  @Patch('org')
  updateOrg(@CurrentOrg() orgId: string, @Body() dto: UpdateOrgDto) {
    return this.settingsService.updateOrg(orgId, dto);
  }

  // ── Team members ─────────────────────────────────────────────────

  /** GET /settings/team */
  @Get('team')
  listMembers(@CurrentOrg() orgId: string) {
    return this.settingsService.listMembers(orgId);
  }

  /** POST /settings/team/invite */
  @Post('team/invite')
  inviteMember(
    @CurrentOrg() orgId: string,
    @CurrentUser() userId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.settingsService.inviteMember(orgId, userId, dto);
  }

  /** PATCH /settings/team/:memberId/role */
  @Patch('team/:memberId/role')
  updateMemberRole(
    @CurrentOrg() orgId: string,
    @CurrentUser() userId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.settingsService.updateMemberRole(orgId, userId, memberId, dto);
  }

  /** DELETE /settings/team/:memberId */
  @Delete('team/:memberId')
  removeMember(
    @CurrentOrg() orgId: string,
    @CurrentUser() userId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.settingsService.removeMember(orgId, userId, memberId);
  }

  // ── User profile ─────────────────────────────────────────────────

  /** GET /settings/profile */
  @Get('profile')
  getProfile(@CurrentUser() userId: string) {
    return this.settingsService.getProfile(userId);
  }

  /** PATCH /settings/profile */
  @Patch('profile')
  updateProfile(@CurrentUser() userId: string, @Body() dto: UpdateProfileDto) {
    return this.settingsService.updateProfile(userId, dto);
  }

  /** PATCH /settings/profile/password */
  @Patch('profile/password')
  changePassword(
    @CurrentUser() userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.settingsService.changePassword(userId, dto);
  }
}
