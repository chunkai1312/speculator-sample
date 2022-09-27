import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlanDocument = Plan & Document;

@Schema({ timestamps: true })
export class Plan {
  @Prop()
  symbol: string;

  @Prop()
  price: number;

  @Prop()
  days: number[];

  @Prop()
  startDate: string;

  @Prop()
  endDate: string;

  @Prop()
  preorders: Array<{ date: string; placed: boolean; }>;

  @Prop({ default: false })
  completed: boolean;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
