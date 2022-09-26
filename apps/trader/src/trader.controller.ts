import { Controller, Get } from '@nestjs/common';
import { TraderService } from './trader.service';

@Controller()
export class TraderController {
  constructor(private readonly traderService: TraderService) {}

  @Get()
  getHello(): string {
    return this.traderService.getHello();
  }
}
