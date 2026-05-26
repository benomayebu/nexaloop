import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { CrmMessageAuthorType } from '@prisma/client';

export class CreateMessageDto {
  @IsEnum(CrmMessageAuthorType)
  authorType: CrmMessageAuthorType;

  @IsString()
  @MinLength(1)
  authorName: string;

  @IsString()
  @IsOptional()
  authorUserId?: string;

  @IsString()
  @MinLength(1)
  body: string;
}
