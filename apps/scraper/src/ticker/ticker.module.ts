import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ticker, TickerSchema } from './ticker.schema';
import { TickerRepository } from './ticker.repository';
import { TickerService } from './ticker.service';
import { ScraperModule } from '../scraper/scraper.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticker.name, schema: TickerSchema },
    ]),
    ScraperModule,
  ],
  providers: [TickerRepository, TickerService],
  exports: [TickerRepository, TickerService],
})
export class TickerModule {}
