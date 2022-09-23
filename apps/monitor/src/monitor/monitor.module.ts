import { Module } from '@nestjs/common';
import { FugleRealtimeModule } from '@fugle/realtime-nest';

@Module({
  imports: [
    FugleRealtimeModule.registerAsync({
      useFactory: () => ({
        apiToken: process.env.FUGLE_REALTIME_API_TOKEN,
      }),
    }),
  ],
})
export class MonitorModule {}
