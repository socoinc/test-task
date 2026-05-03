import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyticsSyncService } from '../analytics/analytics-sync.service';
import { AuthenticatedUser } from '../common/types/authenticated-request';
import { RedisService } from '../infrastructure/redis/redis.service';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import { UpdatePromocodeDto } from './dto/update-promocode.dto';
import { Promocode, PromocodeDocument } from './schemas/promocode.schema';

const normalizeCode = (code: string): string => code.trim().toUpperCase();

@Injectable()
export class PromocodesService {
  constructor(
    @InjectModel(Promocode.name)
    private readonly promocodeModel: Model<PromocodeDocument>,
    private readonly analyticsSyncService: AnalyticsSyncService,
    private readonly redisService: RedisService,
  ) {}

  async create(
    dto: CreatePromocodeDto,
    user: AuthenticatedUser,
  ): Promise<PromocodeDocument> {
    const normalizedCode = normalizeCode(dto.code);

    const existingPromocode = await this.promocodeModel.findOne({
      code: normalizedCode,
    });

    if (existingPromocode) {
      throw new ConflictException('Promocode with this code already exists');
    }

    this.validateDateRange(dto.startsAt, dto.expiresAt);

    const promocode = await this.promocodeModel.create({
      code: normalizedCode,
      description: dto.description?.trim() ?? '',
      discountPercent: dto.discountPercent,
      totalUsageLimit: dto.totalUsageLimit,
      perUserUsageLimit: dto.perUserUsageLimit,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      createdBy: user.id,
    });

    await this.analyticsSyncService.syncPromocode(promocode);
    await this.invalidateAnalyticsCache();

    return promocode;
  }

  async getById(id: string): Promise<PromocodeDocument> {
    const promocode = await this.promocodeModel.findById(id);

    if (!promocode) {
      throw new NotFoundException('Promocode not found');
    }

    return promocode;
  }

  async update(
    id: string,
    dto: UpdatePromocodeDto,
  ): Promise<PromocodeDocument> {
    this.validateDateRange(dto.startsAt, dto.expiresAt);

    if (dto.code) {
      const normalizedCode = normalizeCode(dto.code);
      const existingPromocode = await this.promocodeModel.findOne({
        code: normalizedCode,
        _id: {
          $ne: id,
        },
      });

      if (existingPromocode) {
        throw new ConflictException('Promocode with this code already exists');
      }
    }

    const promocode = await this.promocodeModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(dto.code ? { code: normalizeCode(dto.code) } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description.trim() }
            : {}),
          ...(dto.discountPercent !== undefined
            ? { discountPercent: dto.discountPercent }
            : {}),
          ...(dto.totalUsageLimit !== undefined
            ? { totalUsageLimit: dto.totalUsageLimit }
            : {}),
          ...(dto.perUserUsageLimit !== undefined
            ? { perUserUsageLimit: dto.perUserUsageLimit }
            : {}),
          ...(dto.startsAt !== undefined
            ? { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }
            : {}),
          ...(dto.expiresAt !== undefined
            ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!promocode) {
      throw new NotFoundException('Promocode not found');
    }

    await this.analyticsSyncService.syncPromocode(promocode);
    await this.invalidateAnalyticsCache();

    return promocode;
  }

  async deactivate(id: string): Promise<PromocodeDocument> {
    const promocode = await this.promocodeModel.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive: false,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!promocode) {
      throw new NotFoundException('Promocode not found');
    }

    await this.analyticsSyncService.syncPromocode(promocode);
    await this.invalidateAnalyticsCache();

    return promocode;
  }

  async findByCode(code: string): Promise<PromocodeDocument | null> {
    return this.promocodeModel.findOne({
      code: normalizeCode(code),
    });
  }

  async incrementUsage(promocodeId: string): Promise<PromocodeDocument | null> {
    return this.promocodeModel.findOneAndUpdate(
      {
        _id: promocodeId,
        isActive: true,
        $expr: {
          $lt: ['$usedCount', '$totalUsageLimit'],
        },
      },
      {
        $inc: {
          usedCount: 1,
        },
      },
      {
        new: true,
      },
    );
  }

  private validateDateRange(
    startsAt?: string | null,
    expiresAt?: string | null,
  ): void {
    if (!startsAt || !expiresAt) {
      return;
    }

    if (new Date(startsAt) > new Date(expiresAt)) {
      throw new ConflictException(
        'Promocode start date must be before end date',
      );
    }
  }

  private async invalidateAnalyticsCache(): Promise<void> {
    await this.redisService.deleteByPattern('analytics:*');
  }
}
