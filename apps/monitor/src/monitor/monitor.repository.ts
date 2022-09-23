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
    return this.model.find();
  }

  async getAlerts(): Promise<MonitorDocument[]> {
    return this.model.find({ alert: { $exists: true } });
  }

  async createAlert(createAlertDto: CreateAlertDto): Promise<MonitorDocument> {
    const { title, message, ...monitorable } = createAlertDto;
    const alert = { title, message };
    const monitor = { ...monitorable, alert }
    return this.model.create(monitor);
  }

  async getAlertById(id: string): Promise<MonitorDocument> {
    return this.model.findOne({ _id: id, alert: { $exists: true } });
  }

  async removeAlertById(id: string): Promise<void> {
    await this.model.deleteOne({ _id: id, alert: { $exists: true } });
  }
}
