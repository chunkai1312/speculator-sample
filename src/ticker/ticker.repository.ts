import { DateTime } from 'luxon';
import { find } from 'lodash';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TickerType, Market, Index } from '@speculator/common';
import { Ticker, TickerDocument } from './ticker.schema';

@Injectable()
export class TickerRepository {
  constructor(
    @InjectModel(Ticker.name) private readonly model: Model<TickerDocument>,
  ) {}

  async updateTicker(ticker: Partial<Ticker>) {
    const { date, symbol } = ticker;
    return this.model.updateOne({ date, symbol }, ticker, { upsert: true });
  }

  async getMoneyFlow(options?: { date?: string, market?: Market }) {
    const date = options?.date || DateTime.local().toISODate();
    const market = options?.market || Market.TSE;

    const results = await this.model.aggregate([
      { $match: {
          date: { $lte: date },
          type: TickerType.Index,
          market: market || { $ne: null },
          symbol: { $nin: [Index.NonElectronics, Index.NonFinance, Index.NonFinanceNonElectronics] },
        },
      },
      { $project: { _id: 0, __v: 0, createdAt: 0 , updatedAt: 0 } },
      { $group: { _id: '$date', data: { $push: '$$ROOT' } } },
      { $sort: { _id: -1 } },
      { $limit: 2 },
    ]);

    const [ tickers, tickersPrev ] = results.map(doc => doc.data);

    const data = tickers.map(doc => {
      const tradeValuePrev = find(tickersPrev, { symbol: doc.symbol }).tradeValue;
      const tradeWeightPrev = find(tickersPrev, { symbol: doc.symbol }).tradeWeight;
      const tradeValueChange = parseFloat((doc.tradeValue - tradeValuePrev).toPrecision(12));
      const tradeWeightChange = parseFloat((doc.tradeWeight - tradeWeightPrev).toPrecision(12));
      return { ...doc, tradeValuePrev, tradeWeightPrev, tradeValueChange, tradeWeightChange };
    });

    return data;
  }
}
