import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PromocodeDocument = HydratedDocument<Promocode>;

@Schema({
  timestamps: true,
})
export class Promocode {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  code: string;

  @Prop({
    default: '',
    trim: true,
  })
  description: string;

  @Prop({
    required: true,
    min: 1,
    max: 100,
  })
  discountPercent: number;

  @Prop({
    required: true,
    min: 1,
  })
  totalUsageLimit: number;

  @Prop({
    required: true,
    min: 1,
  })
  perUserUsageLimit: number;

  @Prop({
    required: true,
    default: 0,
    min: 0,
  })
  usedCount: number;

  @Prop({
    required: true,
    default: true,
  })
  isActive: boolean;

  @Prop()
  startsAt?: Date | null;

  @Prop()
  expiresAt?: Date | null;

  @Prop({
    required: true,
  })
  createdBy: string;

  createdAt: Date;
  updatedAt: Date;
}

export const PromocodeSchema = SchemaFactory.createForClass(Promocode);
