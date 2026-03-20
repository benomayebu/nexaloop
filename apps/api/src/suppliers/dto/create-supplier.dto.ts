import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { SupplierType, SupplierStatus, RiskLevel } from '@prisma/client';

export class CreateSupplierDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(SupplierType)
  type: SupplierType;

  @IsString()
  @MinLength(1)
  country: string;

  @IsString()
  @IsOptional()
  supplierCode?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsEnum(SupplierStatus)
  @IsOptional()
  status?: SupplierStatus;

  @IsEnum(RiskLevel)
  @IsOptional()
  riskLevel?: RiskLevel;

  @IsString()
  @IsOptional()
  notes?: string;
}
