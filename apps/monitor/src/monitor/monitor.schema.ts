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
    message: { type: String },
  }))
  alert: Record<string, string>;

  @Prop(raw({
    stockNo: { type: String },
    buySell: { type: String },
    price: { type: Number },
    quantity: { type: Number },
    apCode: { type: String },
    priceFlag: { type: String },
    bsFlag: { type: String },
    trade: { type: String },
  }))
  order: Record<string, string | number>;

  @Prop({ default: false })
  triggered: boolean;
}

export const MonitorSchema = SchemaFactory.createForClass(Monitor);
