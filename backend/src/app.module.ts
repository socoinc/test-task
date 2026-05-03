import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './common/config/env';
import { AnalyticsModule } from './analytics/analytics.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { ClickHouseModule } from './infrastructure/clickhouse/clickhouse.module';
import { OrdersModule } from './orders/orders.module';
import { PromocodesModule } from './promocodes/promocodes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URI'),
      }),
    }),

    UsersModule,
    AuthModule,
    AnalyticsModule,
    PromocodesModule,
    OrdersModule,
    RedisModule,
    ClickHouseModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
