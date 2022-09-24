import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Monitor, MonitorDocument } from './monitor.schema';
import { CreateAlertDto } from './dto/create-alert.dto';

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
}
