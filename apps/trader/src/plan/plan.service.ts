import { DateTime } from 'luxon';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HttpClient } from '@fugle/realtime';
import { FugleTrade, Order } from '@fugle/trade';
import { InjectHttpClient } from '@fugle/realtime-nest';
import { InjectFugleTrade } from '@fugle/trade-nest';
import { PlanRepository } from './plan.repository';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlanService {
  constructor(
    @InjectHttpClient() private readonly client: HttpClient,
    @InjectFugleTrade() private readonly fugle: FugleTrade,
    private readonly PlanRepository: PlanRepository,
  ) {}

  async getPlans() {
    return this.PlanRepository.getPlans();
  }

  async createPlan(createPlanDto: CreatePlanDto) {
    return this.PlanRepository.createPlan(createPlanDto);
  }

  async removePlan(id: string) {
    return this.PlanRepository.removePlan(id);
  }

  @Cron('0 29 13 * * *')
  async execute() {
    const date = DateTime.local().toISODate();
    const plans = await this.PlanRepository.getPlansToExecute(date);

    for (const plan of plans) {
      const res = await this.client.intraday.quote({ symbolId: plan.symbol, oddLot: true });
      if (res.data.info.date !== date) continue;

      const price = res.data.quote.order.asks.pop().price;
      const quantity =  Math.floor(plan.price / price);

      const order = new Order({
        stockNo: plan.symbol,
        buySell: Order.Side.Buy,
        price,
        quantity,
        apCode: Order.ApCode.IntradayOdd,
        priceFlag: Order.PriceFlag.Limit,
        bsFlag: Order.BsFlag.ROD,
        trade: Order.Trade.Cash,
      });
      await this.fugle.placeOrder(order);

      const preorder = plan.preorders.find(preorder => preorder.date <= date && preorder.placed === false);
      await this.PlanRepository.updateExecutedPlan(plan.id, preorder.date);
    }
  }
}
