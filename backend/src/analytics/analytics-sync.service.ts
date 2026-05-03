import { Injectable, Logger } from '@nestjs/common';
import { ClickHouseService } from '../infrastructure/clickhouse/clickhouse.service';
import { OrderDocument } from '../orders/schemas/order.schema';
import { PromoUsageDocument } from '../orders/schemas/promo-usage.schema';
import { PromocodeDocument } from '../promocodes/schemas/promocode.schema';
import { UserDocument } from '../users/schemas/user.schema';

const toDateTime = (value: Date | null | undefined): string | null =>
  value ? value.toISOString().slice(0, 19) : null;

const toVersion = (value: Date): number => value.getTime();

@Injectable()
export class AnalyticsSyncService {
  private readonly logger = new Logger(AnalyticsSyncService.name);

  constructor(private readonly clickHouseService: ClickHouseService) {}

  async syncUser(user: UserDocument): Promise<void> {
    await this.safeSync(async () => {
      await this.clickHouseService.insertRows('users', [
        {
          user_id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          is_active: user.isActive,
          created_at: toDateTime(user.createdAt) ?? toDateTime(new Date()),
          updated_at: toDateTime(user.updatedAt) ?? toDateTime(new Date()),
          version: toVersion(user.updatedAt ?? new Date()),
        },
      ]);
    }, `user:${user.id}`);
  }

  async syncPromocode(promocode: PromocodeDocument): Promise<void> {
    await this.safeSync(async () => {
      await this.clickHouseService.insertRows('promocodes', [
        {
          promocode_id: promocode.id,
          code: promocode.code,
          description: promocode.description,
          discount_percent: promocode.discountPercent,
          total_usage_limit: promocode.totalUsageLimit,
          per_user_usage_limit: promocode.perUserUsageLimit,
          used_count: promocode.usedCount,
          is_active: promocode.isActive,
          starts_at: toDateTime(promocode.startsAt),
          expires_at: toDateTime(promocode.expiresAt),
          created_by: promocode.createdBy,
          created_at: toDateTime(promocode.createdAt) ?? toDateTime(new Date()),
          updated_at: toDateTime(promocode.updatedAt) ?? toDateTime(new Date()),
          version: toVersion(promocode.updatedAt ?? new Date()),
        },
      ]);
    }, `promocode:${promocode.id}`);
  }

  async syncOrder(order: OrderDocument): Promise<void> {
    await this.safeSync(async () => {
      await this.clickHouseService.insertRows('orders', [
        {
          order_id: order.id,
          user_id: order.userId,
          user_email: order.userEmail,
          user_name: order.userName,
          amount: order.amount,
          discount_amount: order.discountAmount,
          final_amount: order.finalAmount,
          promocode_id: order.promocodeId ?? null,
          promocode_code: order.promocodeCode ?? null,
          created_at: toDateTime(order.createdAt) ?? toDateTime(new Date()),
          updated_at: toDateTime(order.updatedAt) ?? toDateTime(new Date()),
          version: toVersion(order.updatedAt ?? new Date()),
        },
      ]);
    }, `order:${order.id}`);
  }

  async syncPromoUsage(usage: PromoUsageDocument): Promise<void> {
    await this.safeSync(async () => {
      await this.clickHouseService.insertRows('promo_usages', [
        {
          usage_id: usage.id,
          promocode_id: usage.promocodeId,
          promocode_code: usage.promocodeCode,
          user_id: usage.userId,
          user_email: usage.userEmail,
          user_name: usage.userName,
          order_id: usage.orderId,
          order_amount: usage.orderAmount,
          discount_amount: usage.discountAmount,
          applied_at: toDateTime(usage.createdAt) ?? toDateTime(new Date()),
        },
      ]);
    }, `promo-usage:${usage.id}`);
  }

  private async safeSync(
    callback: () => Promise<void>,
    entityLabel: string,
  ): Promise<void> {
    try {
      await callback();
    } catch (error) {
      this.logger.error(
        `ClickHouse sync failed for ${entityLabel}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }
}
