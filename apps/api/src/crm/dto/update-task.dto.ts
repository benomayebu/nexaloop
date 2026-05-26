import { IsString, IsEnum, IsOptional, IsDateString, MinLength } from 'class-validator';
import { CrmTaskPriority, CrmTaskStatus } from '@prisma/client';

export class UpdateTaskDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  documentId?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsEnum(CrmTaskPriority)
  @IsOptional()
  priority?: CrmTaskPriority;

  @IsEnum(CrmTaskStatus)
  @IsOptional()
  status?: CrmTaskStatus;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
