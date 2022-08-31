import { Module } from '@nestjs/common';
import { TwseScraperService } from './twse-scraper.service';

@Module({
  providers: [TwseScraperService]
})
export class ScraperModule {}
