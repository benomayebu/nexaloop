import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrg } from '../auth/current-org.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('suppliers/:supplierId/documents')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }))
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

  @Get('documents/:id/download')
  async downloadDocument(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { doc, downloadUrl } = await this.documentsService.getForDownload(orgId, id);

    // S3 presigned URL — redirect the client directly to S3
    if (downloadUrl.startsWith('http')) {
      return res.redirect(302, downloadUrl);
    }

    // Local disk — stream the file back (dev / Railway without S3)
    const filePath = path.join(process.cwd(), downloadUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }
    res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}"`);
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
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
