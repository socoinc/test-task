import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsModule } from '../analytics/analytics.module';
import { Promocode, PromocodeSchema } from './schemas/promocode.schema';
import { PromocodesController } from './promocodes.controller';
import { PromocodesService } from './promocodes.service';

@Module({
  imports: [
    AnalyticsModule,
    MongooseModule.forFeature([
      {
        name: Promocode.name,
        schema: PromocodeSchema,
      },
    ]),
  ],
  controllers: [PromocodesController],
  providers: [PromocodesService],
  exports: [PromocodesService, MongooseModule],
})
export class PromocodesModule {}
