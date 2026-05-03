import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
})
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
    minlength: 2,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    minlength: 5,
    trim: true,
  })
  phone: string;

  @Prop({
    required: true,
    default: true,
  })
  isActive: boolean;

  @Prop({
    required: true,
    select: false,
  })
  passwordHash: string;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
