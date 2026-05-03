import { Controller, Get } from '@nestjs/common';
import { ClickHouseService } from './infrastructure/clickhouse/clickhouse.service';
import { RedisService } from './infrastructure/redis/redis.service';
import mongoose from 'mongoose';

@Controller()
export class AppController {
  constructor(
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
        mongodb:
          mongoose.connection.readyState === mongoose.ConnectionStates.connected
            ? 'CONNECTED'
            : 'DISCONNECTED',
        redis,
        clickhouse,
      },
    };
  }
}
