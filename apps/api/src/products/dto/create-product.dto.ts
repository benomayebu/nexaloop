import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  sku: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  season?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
