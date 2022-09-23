import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FugleRealtimeModule } from '@fugle/realtime-nest';
import { Monitor, MonitorSchema } from './monitor.schema';
import { MonitorRepository } from './monitor.repository';
import { MonitorService } from './monitor.service';
import { MonitorController } from './monitor.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Monitor.name, schema: MonitorSchema },
    ]),
    FugleRealtimeModule.registerAsync({
      useFactory: () => ({
        apiToken: process.env.FUGLE_REALTIME_API_TOKEN,
      }),
    }),
  ],
  providers: [MonitorRepository, MonitorService],
  controllers: [MonitorController],
})
export class MonitorModule {}
