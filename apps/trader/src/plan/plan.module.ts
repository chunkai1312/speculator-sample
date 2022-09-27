import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FugleRealtimeModule } from '@fugle/realtime-nest';
import { Plan, PlanSchema } from './plan.schema';
import { PlanRepository } from './plan.repository';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Plan.name, schema: PlanSchema },
    ]),
    FugleRealtimeModule.registerAsync({
      useFactory: () => ({
        apiToken: process.env.FUGLE_REALTIME_API_TOKEN,
      }),
    }),
  ],
  providers: [PlanRepository, PlanService],
  controllers: [PlanController],
})
export class PlanModule {}
