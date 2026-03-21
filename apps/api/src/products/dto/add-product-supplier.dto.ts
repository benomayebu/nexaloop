import { IsString, IsEnum } from 'class-validator';
import { ProductSupplierRole } from '@prisma/client';

export class AddProductSupplierDto {
  @IsString()
  supplierId: string;

  @IsEnum(ProductSupplierRole)
  role: ProductSupplierRole;
}
