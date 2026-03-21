import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DocumentTypesService } from './document-types.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrg } from '../auth/current-org.decorator';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';

@Controller('document-types')
@UseGuards(JwtAuthGuard)
export class DocumentTypesController {
  constructor(private readonly documentTypesService: DocumentTypesService) {}

  @Get()
  list(@CurrentOrg() orgId: string) {
    return this.documentTypesService.list(orgId);
  }

  @Post()
  create(@CurrentOrg() orgId: string, @Body() dto: CreateDocumentTypeDto) {
    return this.documentTypesService.create(orgId, dto);
  }

  @Put(':id')
  update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentTypeDto,
  ) {
    return this.documentTypesService.update(orgId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.documentTypesService.softDelete(orgId, id);
  }
}
