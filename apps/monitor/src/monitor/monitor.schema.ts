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
}

export const MonitorSchema = SchemaFactory.createForClass(Monitor);
