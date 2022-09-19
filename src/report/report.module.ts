import { Module } from '@nestjs/common';
import { MarketStatsModule } from '../market-stats/market-stats.module';
import { TickerModule } from '../ticker/ticker.module';

@Module({
  imports: [MarketStatsModule, TickerModule],
})
export class ReportModule {}
