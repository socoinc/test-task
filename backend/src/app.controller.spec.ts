import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { ClickHouseService } from './infrastructure/clickhouse/clickhouse.service';
import { RedisService } from './infrastructure/redis/redis.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: getConnectionToken(),
          useValue: {
            readyState: 1,
          },
        },
        {
          provide: RedisService,
          useValue: {
            ping: jest.fn().mockResolvedValue('PONG'),
          },
        },
        {
          provide: ClickHouseService,
          useValue: {
            ping: jest.fn().mockResolvedValue('OK'),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return service status', () => {
      expect(appController.getRoot()).toEqual({
        service: 'promocode-api',
        status: 'ok',
      });
    });
  });
});
