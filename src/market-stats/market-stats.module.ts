import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketStats, MarketStatsSchema } from './market-stats.schema';
import { MarketStatsRepository } from './market-stats.repository';
import { MarketStatsService } from './market-stats.service';
import { ScraperModule } from '../scraper/scraper.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MarketStats.name, schema: MarketStatsSchema },
    ]),
    ScraperModule,
  ],
  providers: [MarketStatsRepository, MarketStatsService],
  exports: [MarketStatsRepository],
})
export class MarketStatsModule {}
