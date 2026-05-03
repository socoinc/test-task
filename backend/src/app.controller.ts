import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ClickHouseService } from './infrastructure/clickhouse/clickhouse.service';
import { RedisService } from './infrastructure/redis/redis.service';

@Controller()
export class AppController {
  constructor(
    @InjectConnection()
    private readonly mongoConnection: Connection,
    private readonly redisService: RedisService,
    private readonly clickHouseService: ClickHouseService,
  ) {}

  @Get()
  getRoot() {
    return {
      service: 'promocode-api',
      status: 'ok',
    };
  }

  @Get('health')
  async getHealth() {
    const [redis, clickhouse] = await Promise.all([
      this.redisService.ping(),
      this.clickHouseService.ping(),
    ]);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: this.mongoConnection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
        redis,
        clickhouse,
      },
    };
  }
}
