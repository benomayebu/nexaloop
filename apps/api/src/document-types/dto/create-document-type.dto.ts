import {
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';
import { SupplierType } from '@prisma/client';

export class CreateDocumentTypeDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsEnum(SupplierType, { each: true })
  @IsOptional()
  requiredForSupplierTypes?: SupplierType[];
}
