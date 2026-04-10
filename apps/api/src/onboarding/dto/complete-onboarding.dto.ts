import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CompleteOnboardingDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  supplierName?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  supplierCountry?: string;
}
