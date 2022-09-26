import { Module } from '@nestjs/common';
import { TraderController } from './trader.controller';
import { TraderService } from './trader.service';

@Module({
  imports: [],
  controllers: [TraderController],
  providers: [TraderService],
})
export class TraderModule {}
