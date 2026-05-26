import { IsString, IsEnum, IsOptional, IsDateString, MinLength } from 'class-validator';
import { CrmTaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title: string;

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
  assigneeId: string;

  @IsEnum(CrmTaskPriority)
  @IsOptional()
  priority?: CrmTaskPriority;

  @IsDateString()
  dueDate: string;
}
