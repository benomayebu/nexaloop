import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { DocumentStatus } from '@prisma/client';

// NOTE: reviewedByUserId is intentionally absent — it is derived from
// @CurrentUser() in the service, never accepted from the request body.
export class UpdateDocumentDto {
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  @IsString()
  @IsOptional()
  reviewNotes?: string;

  @IsDateString()
  @IsOptional()
  issuedDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}
