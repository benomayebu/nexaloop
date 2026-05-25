import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  password: string;

  @IsString()
  @MinLength(2)
  orgName: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  vat?: string;

  // Legacy fields — still accepted for backwards compatibility
  @IsString()
  @IsOptional()
  industry?: string;

  @IsString()
  @IsOptional()
  supplierCount?: string;

  @IsString()
  @IsOptional()
  primaryConcern?: string;
}
