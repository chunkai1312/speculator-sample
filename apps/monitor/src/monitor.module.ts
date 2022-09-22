import { Module } from '@nestjs/common';
import { MonitorController } from './monitor.controller';
import { MonitorService } from './monitor.service';

@Module({
  imports: [],
  controllers: [MonitorController],
  providers: [MonitorService],
})
export class MonitorModule {}
