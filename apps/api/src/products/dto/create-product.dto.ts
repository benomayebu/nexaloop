import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsDateString, Min, Max, MinLength } from 'class-validator';
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

  // DPP fields
  @IsBoolean()
  @IsOptional()
  dppEnabled?: boolean;

  @IsString()
  @IsOptional()
  materialComposition?: string;

  @IsString()
  @IsOptional()
  countryOfOrigin?: string;

  @IsDateString()
  @IsOptional()
  manufacturingDate?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsString()
  @IsOptional()
  weightUnit?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  recycledContent?: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  repairabilityScore?: number;
}
