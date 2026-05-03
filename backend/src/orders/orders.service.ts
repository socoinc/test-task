import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { AnalyticsSyncService } from '../analytics/analytics-sync.service';
import { AuthenticatedUser } from '../common/types/authenticated-request';
import { RedisService } from '../infrastructure/redis/redis.service';
import { PromocodesService } from '../promocodes/promocodes.service';
import { UsersService } from '../users/users.service';
import { ApplyPromocodeDto } from './dto/apply-promocode.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderDocument } from './schemas/order.schema';
import { PromoUsage, PromoUsageDocument } from './schemas/promo-usage.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(PromoUsage.name)
    private readonly promoUsageModel: Model<PromoUsageDocument>,
    private readonly usersService: UsersService,
    private readonly promocodesService: PromocodesService,
    private readonly analyticsSyncService: AnalyticsSyncService,
    private readonly redisService: RedisService,
  ) {}

  async createOrder(
    dto: CreateOrderDto,
    user: AuthenticatedUser,
  ): Promise<OrderDocument> {
    const fullUser = await this.usersService.findById(user.id);

    if (!fullUser || !fullUser.isActive) {
      throw new ForbiddenException('Active user account is required');
    }

    const order = await this.orderModel.create({
      userId: fullUser.id,
      userEmail: fullUser.email,
      userName: fullUser.name,
      amount: dto.amount,
      discountAmount: 0,
      finalAmount: dto.amount,
      promocodeId: null,
      promocodeCode: null,
    });

    await this.analyticsSyncService.syncOrder(order);
    await this.invalidateAnalyticsCache();

    return order;
  }

  async getMyOrders(userId: string): Promise<OrderDocument[]> {
    return this.orderModel.find({ userId }).sort({ createdAt: -1 });
  }

  async applyPromocode(
    orderId: string,
    dto: ApplyPromocodeDto,
    user: AuthenticatedUser,
  ): Promise<OrderDocument> {
    const lockKey = `lock:apply-promocode:${orderId}:${dto.code.trim().toUpperCase()}`;
    const lockToken = randomUUID();

    const lockAcquired = await this.redisService.acquireLock(
      lockKey,
      lockToken,
      10_000,
    );

    if (!lockAcquired) {
      throw new ConflictException('Promocode is being applied right now');
    }

    try {
      const order = await this.orderModel.findById(orderId);

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.userId !== user.id) {
        throw new ForbiddenException('This order does not belong to you');
      }

      if (order.promocodeId) {
        throw new ConflictException(
          'A promocode has already been applied to this order',
        );
      }

      const promocode = await this.promocodesService.findByCode(dto.code);

      if (!promocode) {
        throw new NotFoundException('Promocode not found');
      }

      if (!promocode.isActive) {
        throw new ConflictException('Promocode is inactive');
      }

      const now = new Date();

      if (promocode.startsAt && promocode.startsAt > now) {
        throw new ConflictException('Promocode is not active yet');
      }

      if (promocode.expiresAt && promocode.expiresAt < now) {
        throw new ConflictException('Promocode has expired');
      }

      const userUsageCount = await this.promoUsageModel.countDocuments({
        promocodeId: promocode.id,
        userId: user.id,
      });

      if (userUsageCount >= promocode.perUserUsageLimit) {
        throw new ConflictException('Promocode per-user usage limit exceeded');
      }

      if (promocode.usedCount >= promocode.totalUsageLimit) {
        throw new ConflictException('Promocode total usage limit exceeded');
      }

      const updatedPromocode = await this.promocodesService.incrementUsage(
        promocode.id,
      );

      if (!updatedPromocode) {
        throw new ConflictException('Promocode total usage limit exceeded');
      }

      const discountAmount = Number(
        ((order.amount * updatedPromocode.discountPercent) / 100).toFixed(2),
      );
      const finalAmount = Number((order.amount - discountAmount).toFixed(2));

      if (finalAmount < 0) {
        throw new BadRequestException('Invalid discounted order amount');
      }

      order.promocodeId = updatedPromocode.id;
      order.promocodeCode = updatedPromocode.code;
      order.discountAmount = discountAmount;
      order.finalAmount = finalAmount;

      await order.save();

      const usage = await this.promoUsageModel.create({
        promocodeId: updatedPromocode.id,
        promocodeCode: updatedPromocode.code,
        userId: order.userId,
        userEmail: order.userEmail,
        userName: order.userName,
        orderId: order.id,
        orderAmount: order.amount,
        discountAmount,
      });

      await this.analyticsSyncService.syncPromocode(updatedPromocode);
      await this.analyticsSyncService.syncOrder(order);
      await this.analyticsSyncService.syncPromoUsage(usage);
      await this.invalidateAnalyticsCache();

      return order;
    } finally {
      await this.redisService.releaseLock(lockKey, lockToken);
    }
  }

  private async invalidateAnalyticsCache(): Promise<void> {
    await this.redisService.deleteByPattern('analytics:*');
  }
}
