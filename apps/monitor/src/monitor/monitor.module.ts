import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FugleRealtimeModule } from '@fugle/realtime-nest';
import { Monitor, MonitorSchema } from './monitor.schema';
import { MonitorRepository } from './monitor.repository';
import { MonitorService } from './monitor.service';

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
})
export class MonitorModule {}
