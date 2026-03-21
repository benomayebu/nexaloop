import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  documentTypeId: string;

  @IsDateString()
  @IsOptional()
  issuedDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}
