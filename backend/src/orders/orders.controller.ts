import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { ApplyPromocodeDto } from './dto/apply-promocode.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ordersService.createOrder(dto, request.user);
  }

  @Get('my')
  async getMyOrders(@Req() request: AuthenticatedRequest) {
    return this.ordersService.getMyOrders(request.user.id);
  }

  @Post(':id/apply-promocode')
  async applyPromocode(
    @Param('id') orderId: string,
    @Body() dto: ApplyPromocodeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ordersService.applyPromocode(orderId, dto, request.user);
  }
}
