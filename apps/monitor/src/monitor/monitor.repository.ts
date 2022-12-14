import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Monitor, MonitorDocument } from './monitor.schema';
import { CreateAlertDto } from './dto/create-alert.dto';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class MonitorRepository {
  constructor(
    @InjectModel(Monitor.name) private readonly model: Model<MonitorDocument>,
  ) {}

  async getMonitors(): Promise<MonitorDocument[]> {
    return this.model.find({ triggered: false });
  }

  async triggerMonitor(id: string): Promise<void> {
    await this.model.updateOne({ _id: id }, { triggered: true });
  }

  async getAlerts(): Promise<MonitorDocument[]> {
    return this.model
      .find({ alert: { $exists: true } })
      .select('-__v -createdAt -updatedAt')
      .lean();
  }

  async createAlert(createAlertDto: CreateAlertDto): Promise<MonitorDocument> {
    const { title, message, ...monitorable } = createAlertDto;
    const alert = { title, message };
    const monitor = { ...monitorable, alert }
    return this.model.create(monitor);
  }

  async getAlert(id: string): Promise<MonitorDocument> {
    return this.model
      .findOne({ _id: id, alert: { $exists: true } })
      .select('-__v -createdAt -updatedAt')
      .lean();
  }

  async removeAlert(id: string): Promise<void> {
    await this.model.deleteOne({ _id: id, alert: { $exists: true } });
  }

  async getOrders(): Promise<MonitorDocument[]> {
    return this.model.find({ order: { $exists: true } })
      .select('-__v -createdAt -updatedAt')
      .lean();
  }

  async createOrder(createOrderDto: CreateOrderDto): Promise<MonitorDocument> {
    const { order, ...monitorable } = createOrderDto;
    const monitor = { ...monitorable, order: JSON.parse(order) }
    return this.model.create(monitor);
  }

  async getOrder(id: string): Promise<MonitorDocument> {
    return this.model
      .findOne({ _id: id, order: { $exists: true } })
      .select('-__v -createdAt -updatedAt')
      .lean();
  }

  async removeOrder(id: string): Promise<void> {
    await this.model.deleteOne({ _id: id, order: { $exists: true } });
  }
}
