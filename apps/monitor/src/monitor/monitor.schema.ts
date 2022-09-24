import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MonitorDocument = Monitor & Document;

@Schema({ timestamps: true })
export class Monitor {
  @Prop()
  symbol: string;

  @Prop()
  type: string;

  @Prop()
  value: string;

  @Prop(raw({
    title: { type: String },
    message: { type: String }
  }))
  alert: Record<string, string>;

  @Prop({ default: false })
  triggered: boolean;
}

export const MonitorSchema = SchemaFactory.createForClass(Monitor);
