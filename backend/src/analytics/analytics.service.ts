import { Injectable } from '@nestjs/common';
import { ClickHouseService } from '../infrastructure/clickhouse/clickhouse.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import { PromoUsagesQueryDto } from './dto/promo-usages-query.dto';
import { PromocodesAnalyticsQueryDto } from './dto/promocodes-analytics-query.dto';
import { UsersAnalyticsQueryDto } from './dto/users-analytics-query.dto';

type PaginatedResponse<T> = {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

type ClickHouseCountRow = {
  total: number | string;
};

type UserAnalyticsRow = {
  userId: string;
  email: string;
  name: string;
  phone: string;
  isActive: number;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  totalDiscount: number;
  usedPromocodes: number;
};

type PromocodeAnalyticsRow = {
  promocodeId: string;
  code: string;
  description: string;
  discountPercent: number;
  totalUsageLimit: number;
  perUserUsageLimit: number;
  usedCount: number;
  isActive: number;
  createdAt: string;
  totalRevenue: number;
  totalDiscount: number;
  uniqueUsers: number;
};

type PromoUsageRow = {
  usageId: string;
  promocodeId: string;
  promocodeCode: string;
  userId: string;
  userEmail: string;
  userName: string;
  orderId: string;
  orderAmount: number;
  discountAmount: number;
  appliedAt: string;
};

const usersSortMap = {
  createdAt: 'createdAt',
  name: 'name',
  email: 'email',
  totalOrders: 'totalOrders',
  totalSpent: 'totalSpent',
  totalDiscount: 'totalDiscount',
} as const;

const promocodesSortMap = {
  createdAt: 'createdAt',
  code: 'code',
  usedCount: 'usedCount',
  totalRevenue: 'totalRevenue',
  uniqueUsers: 'uniqueUsers',
} as const;

const promoUsagesSortMap = {
  appliedAt: 'appliedAt',
  promocodeCode: 'promocodeCode',
  userEmail: 'userEmail',
  discountAmount: 'discountAmount',
} as const;

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly clickHouseService: ClickHouseService,
    private readonly redisService: RedisService,
  ) {}

  async getUsersAnalytics(
    query: UsersAnalyticsQueryDto,
  ): Promise<PaginatedResponse<UserAnalyticsRow>> {
    return this.getOrSetCache(
      `analytics:users:${JSON.stringify(query)}`,
      async () => {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 10;
        const offset = (page - 1) * pageSize;
        const sortBy = usersSortMap[query.sortBy ?? 'createdAt'];
        const sortOrder = query.sortOrder ?? 'desc';
        const search = `%${query.search?.trim() ?? ''}%`;

        const dateFilterOrders = this.buildDateFilter(
          'created_at',
          query.dateFrom,
          query.dateTo,
        );
        const dateFilterUsages = this.buildDateFilter(
          'applied_at',
          query.dateFrom,
          query.dateTo,
        );

        const totalRows =
          await this.clickHouseService.query<ClickHouseCountRow>(
            `
          SELECT count(*) AS total
          FROM
          (
            SELECT
              user_id,
              argMax(email, version) AS email,
              argMax(name, version) AS name
            FROM users FINAL
            GROUP BY user_id
          )
          WHERE ({search:String} = '%%')
            OR (email ILIKE {search:String} OR name ILIKE {search:String})
        `,
            { search },
          );

        const items = await this.clickHouseService.query<UserAnalyticsRow>(
          `
          WITH latest_users AS
          (
            SELECT
              user_id,
              argMax(email, version) AS email,
              argMax(name, version) AS name,
              argMax(phone, version) AS phone,
              argMax(is_active, version) AS isActive,
              argMax(created_at, version) AS createdAt
            FROM users FINAL
            GROUP BY user_id
          )
          SELECT
            u.user_id AS userId,
            u.email AS email,
            u.name AS name,
            u.phone AS phone,
            u.isActive AS isActive,
            u.createdAt AS createdAt,
            countDistinctIf(
              o.order_id,
              ${dateFilterOrders.expression}
            ) AS totalOrders,
            round(
              sumIf(o.final_amount, ${dateFilterOrders.expression}),
              2
            ) AS totalSpent,
            round(
              sumIf(o.discount_amount, ${dateFilterOrders.expression}),
              2
            ) AS totalDiscount,
            countDistinctIf(
              pu.promocode_code,
              ${dateFilterUsages.expression}
            ) AS usedPromocodes
          FROM latest_users u
          LEFT JOIN orders AS o FINAL
            ON o.user_id = u.user_id
          LEFT JOIN promo_usages AS pu
            ON pu.user_id = u.user_id
          WHERE ({search:String} = '%%')
            OR (u.email ILIKE {search:String} OR u.name ILIKE {search:String})
          GROUP BY
            u.user_id,
            u.email,
            u.name,
            u.phone,
            u.isActive,
            u.createdAt
          ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
          LIMIT {limit:UInt32}
          OFFSET {offset:UInt32}
        `,
          {
            search,
            limit: pageSize,
            offset,
            ...dateFilterOrders.params,
            ...dateFilterUsages.params,
          },
        );

        return {
          items: items.map((item) => ({
            ...item,
            isActive: Number(item.isActive),
            totalOrders: Number(item.totalOrders ?? 0),
            totalSpent: Number(item.totalSpent ?? 0),
            totalDiscount: Number(item.totalDiscount ?? 0),
            usedPromocodes: Number(item.usedPromocodes ?? 0),
          })),
          meta: {
            page,
            pageSize,
            total: Number(totalRows[0]?.total ?? 0),
          },
        };
      },
    );
  }

  async getPromocodesAnalytics(
    query: PromocodesAnalyticsQueryDto,
  ): Promise<PaginatedResponse<PromocodeAnalyticsRow>> {
    return this.getOrSetCache(
      `analytics:promocodes:${JSON.stringify(query)}`,
      async () => {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 10;
        const offset = (page - 1) * pageSize;
        const sortBy = promocodesSortMap[query.sortBy ?? 'createdAt'];
        const sortOrder = query.sortOrder ?? 'desc';
        const search = `%${query.search?.trim() ?? ''}%`;

        const totalRows =
          await this.clickHouseService.query<ClickHouseCountRow>(
            `
            SELECT count(*) AS total
            FROM
            (
              SELECT
                promocode_id,
                argMax(code, version) AS code
              FROM promocodes FINAL
              GROUP BY promocode_id
            )
            WHERE ({search:String} = '%%') OR code ILIKE {search:String}
          `,
            { search },
          );

        const dateFilterOrders = this.buildDateFilter(
          'created_at',
          query.dateFrom,
          query.dateTo,
        );
        const dateFilterUsages = this.buildDateFilter(
          'applied_at',
          query.dateFrom,
          query.dateTo,
        );

        const items = await this.clickHouseService.query<PromocodeAnalyticsRow>(
          `
            WITH latest_promocodes AS
            (
              SELECT
                promocode_id,
                argMax(code, version) AS code,
                argMax(description, version) AS description,
                argMax(discount_percent, version) AS discountPercent,
                argMax(total_usage_limit, version) AS totalUsageLimit,
                argMax(per_user_usage_limit, version) AS perUserUsageLimit,
                argMax(used_count, version) AS usedCount,
                argMax(is_active, version) AS isActive,
                argMax(created_at, version) AS createdAt
              FROM promocodes FINAL
              GROUP BY promocode_id
            )
            SELECT
              p.promocode_id AS promocodeId,
              p.code AS code,
              p.description AS description,
              p.discountPercent AS discountPercent,
              p.totalUsageLimit AS totalUsageLimit,
              p.perUserUsageLimit AS perUserUsageLimit,
              p.usedCount AS usedCount,
              p.isActive AS isActive,
              p.createdAt AS createdAt,
              round(
                sumIf(o.final_amount, ${dateFilterOrders.expression}),
                2
              ) AS totalRevenue,
              round(
                sumIf(pu.discount_amount, ${dateFilterUsages.expression}),
                2
              ) AS totalDiscount,
              uniqExactIf(pu.user_id, ${dateFilterUsages.expression}) AS uniqueUsers
            FROM latest_promocodes p
            LEFT JOIN orders AS o FINAL
              ON o.promocode_id = p.promocode_id
            LEFT JOIN promo_usages AS pu
              ON pu.promocode_id = p.promocode_id
            WHERE ({search:String} = '%%') OR p.code ILIKE {search:String}
            GROUP BY
              p.promocode_id,
              p.code,
              p.description,
              p.discountPercent,
              p.totalUsageLimit,
              p.perUserUsageLimit,
              p.usedCount,
              p.isActive,
              p.createdAt
            ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
            LIMIT {limit:UInt32}
            OFFSET {offset:UInt32}
          `,
          {
            search,
            limit: pageSize,
            offset,
            ...dateFilterOrders.params,
            ...dateFilterUsages.params,
          },
        );

        return {
          items: items.map((item) => ({
            ...item,
            discountPercent: Number(item.discountPercent ?? 0),
            totalUsageLimit: Number(item.totalUsageLimit ?? 0),
            perUserUsageLimit: Number(item.perUserUsageLimit ?? 0),
            usedCount: Number(item.usedCount ?? 0),
            isActive: Number(item.isActive),
            totalRevenue: Number(item.totalRevenue ?? 0),
            totalDiscount: Number(item.totalDiscount ?? 0),
            uniqueUsers: Number(item.uniqueUsers ?? 0),
          })),
          meta: {
            page,
            pageSize,
            total: Number(totalRows[0]?.total ?? 0),
          },
        };
      },
    );
  }

  async getPromoUsages(
    query: PromoUsagesQueryDto,
  ): Promise<PaginatedResponse<PromoUsageRow>> {
    return this.getOrSetCache(
      `analytics:promo-usages:${JSON.stringify(query)}`,
      async () => {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 10;
        const offset = (page - 1) * pageSize;
        const sortBy = promoUsagesSortMap[query.sortBy ?? 'appliedAt'];
        const sortOrder = query.sortOrder ?? 'desc';
        const search = `%${query.search?.trim() ?? ''}%`;

        const dateFilter = this.buildDateFilter(
          'applied_at',
          query.dateFrom,
          query.dateTo,
        );

        const totalRows =
          await this.clickHouseService.query<ClickHouseCountRow>(
            `
          SELECT count(*) AS total
          FROM promo_usages
          WHERE
            (({search:String} = '%%')
              OR (promocode_code ILIKE {search:String} OR user_email ILIKE {search:String}))
            AND (${dateFilter.expression})
        `,
            {
              search,
              ...dateFilter.params,
            },
          );

        const items = await this.clickHouseService.query<PromoUsageRow>(
          `
          SELECT
            usage_id AS usageId,
            promocode_id AS promocodeId,
            promocode_code AS promocodeCode,
            user_id AS userId,
            user_email AS userEmail,
            user_name AS userName,
            order_id AS orderId,
            order_amount AS orderAmount,
            discount_amount AS discountAmount,
            applied_at AS appliedAt
          FROM promo_usages
          WHERE
            (({search:String} = '%%')
              OR (promocode_code ILIKE {search:String} OR user_email ILIKE {search:String}))
            AND (${dateFilter.expression})
          ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
          LIMIT {limit:UInt32}
          OFFSET {offset:UInt32}
        `,
          {
            search,
            limit: pageSize,
            offset,
            ...dateFilter.params,
          },
        );

        return {
          items: items.map((item) => ({
            ...item,
            orderAmount: Number(item.orderAmount ?? 0),
            discountAmount: Number(item.discountAmount ?? 0),
          })),
          meta: {
            page,
            pageSize,
            total: Number(totalRows[0]?.total ?? 0),
          },
        };
      },
    );
  }

  private buildDateFilter(
    column: string,
    dateFrom?: string,
    dateTo?: string,
  ): {
    expression: string;
    params: Record<string, string>;
  } {
    const parts: string[] = ['1 = 1'];
    const params: Record<string, string> = {};

    if (dateFrom) {
      parts.push(`${column} >= {dateFrom:DateTime}`);
      params.dateFrom = new Date(dateFrom).toISOString().slice(0, 19);
    }

    if (dateTo) {
      parts.push(`${column} <= {dateTo:DateTime}`);
      params.dateTo = new Date(dateTo).toISOString().slice(0, 19);
    }

    return {
      expression: parts.join(' AND '),
      params,
    };
  }

  private async getOrSetCache<T>(
    key: string,
    callback: () => Promise<T>,
  ): Promise<T> {
    const cachedValue = await this.redisService.get(key);

    if (cachedValue) {
      return JSON.parse(cachedValue) as T;
    }

    const value = await callback();
    await this.redisService.set(key, JSON.stringify(value), 30);

    return value;
  }
}
