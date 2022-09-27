import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { FugleRealtimeModule } from '@fugle/realtime-nest';
import { TRADER_SERVICE } from '@speculator/common';
import { Monitor, MonitorSchema } from './monitor.schema';
import { MonitorRepository } from './monitor.repository';
import { MonitorService } from './monitor.service';
import { MonitorController } from './monitor.controller';


@Module({
  imports: [
    ClientsModule.registerAsync([{
      name: TRADER_SERVICE,
      useFactory: () => ({
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST,
          port: +process.env.REDIS_PORT,
        },
      }),
    }]),
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
export class MonitorModule { }
