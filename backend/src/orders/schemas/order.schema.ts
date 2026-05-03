import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({
  timestamps: true,
})
export class Order {
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
    min: 0.01,
  })
  amount: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  discountAmount: number;

  @Prop({
    required: true,
    min: 0,
  })
  finalAmount: number;

  @Prop()
  promocodeId?: string | null;

  @Prop()
  promocodeCode?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
