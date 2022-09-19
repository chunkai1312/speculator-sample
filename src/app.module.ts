import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ScraperModule } from './scraper/scraper.module';
import { MarketStatsModule } from './market-stats/market-stats.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    ScraperModule,
    MarketStatsModule,
  ],
})
export class AppModule {}
