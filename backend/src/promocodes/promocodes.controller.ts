import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import { UpdatePromocodeDto } from './dto/update-promocode.dto';
import { PromocodesService } from './promocodes.service';

@UseGuards(AuthGuard('jwt'))
@Controller('promocodes')
export class PromocodesController {
  constructor(private readonly promocodesService: PromocodesService) {}

  @Post()
  async create(
    @Body() dto: CreatePromocodeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.promocodesService.create(dto, request.user);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.promocodesService.getById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePromocodeDto) {
    return this.promocodesService.update(id, dto);
  }

  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    return this.promocodesService.deactivate(id);
  }
}
