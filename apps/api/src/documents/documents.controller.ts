import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrg } from '../auth/current-org.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('suppliers/:supplierId/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  uploadDocument(
    @CurrentOrg() orgId: string,
    @CurrentUser() userId: string,
    @Param('supplierId') supplierId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentsService.upload(orgId, userId, supplierId, file, dto);
  }

  @Get('suppliers/:supplierId/documents')
  listDocuments(
    @CurrentOrg() orgId: string,
    @Param('supplierId') supplierId: string,
  ) {
    return this.documentsService.listForSupplier(orgId, supplierId);
  }

  @Put('documents/:id')
  updateDocument(
    @CurrentOrg() orgId: string,
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(orgId, id, userId, dto);
  }
}
