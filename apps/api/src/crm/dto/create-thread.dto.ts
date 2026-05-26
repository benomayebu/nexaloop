import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateThreadDto {
  @IsString()
  @MinLength(1)
  subject: string;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  contactId?: string;

  @IsString()
  @MinLength(1)
  body: string;
}
