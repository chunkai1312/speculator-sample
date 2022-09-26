import { Module } from '@nestjs/common';
import { TraderService } from './trader.service';

@Module({
  providers: [TraderService]
})
export class TraderModule {}
