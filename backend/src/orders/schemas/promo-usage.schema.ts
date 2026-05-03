import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PromoUsageDocument = HydratedDocument<PromoUsage>;

@Schema({
  timestamps: true,
})
export class PromoUsage {
  @Prop({
    required: true,
  })
  promocodeId: string;

  @Prop({
    required: true,
  })
  promocodeCode: string;

  @Prop({
    required: true,
  })
  userId: string;

  @Prop({
    required: true,
  })
  userEmail: string;

  @Prop({
    required: true,
  })
  userName: string;

  @Prop({
    required: true,
  })
  orderId: string;

  @Prop({
    required: true,
  })
  orderAmount: number;

  @Prop({
    required: true,
  })
  discountAmount: number;

  createdAt: Date;
  updatedAt: Date;
}

export const PromoUsageSchema = SchemaFactory.createForClass(PromoUsage);
