import { DateTime } from 'luxon';
import { SMA } from 'technicalindicators';
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
      { $project: { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 } },
      { $group: { _id: '$date', data: { $push: '$$ROOT' } } },
      { $sort: { _id: -1, symbol: 1 } },
      { $limit: 2 },
      { $unwind: '$data' },
      { $replaceRoot: { newRoot: '$data' }},
      { $group: {
          _id: '$symbol',
          date: { $first: '$date' },
          type: { $first: '$type' },
          exchange: { $first: '$exchange' },
          market: { $first: '$market' },
          symbol: { $first: '$symbol' },
          name: { $first: '$name' },
          openPrice: { $first: '$openPrice' },
          highPrice: { $first: '$highPrice' },
          lowPrice: { $first: '$lowPrice' },
          closePrice: { $first: '$closePrice' },
          change: { $first: '$change' },
          changePercent: { $first: '$changePercent' },
          tradeValue:{ $first: '$tradeValue' },
          tradeVolume: { $first: '$tradeVolume' },
          tradeWeight: { $first: '$tradeWeight' },
          tradeValuePrev: { $last: '$tradeValue' },
          tradeWeightPrev: { $last: '$tradeWeight' },
        },
      },
      { $project: {
          _id: 0,
          date: 1,
          type: 1,
          exchange: 1,
          market: 1,
          symbol: 1,
          name: 1,
          openPrice: 1,
          highPrice: 1,
          lowPrice: 1,
          closePrice: 1,
          change: 1,
          changePercent: 1,
          tradeValue: 1,
          tradeVolume: 1,
          tradeWeight: 1,
          tradeValuePrev: 1,
          tradeWeightPrev: 1,
          tradeValueChange: { $subtract: [ '$tradeValue', '$tradeValuePrev' ] },
          tradeWeightChange: { $subtract: [ '$tradeWeight', '$tradeWeightPrev' ] },
        },
      },
      { $sort: { symbol: 1 } },
    ]);

    return results;
  }

  async getTopMovers(options?: { date?: string, market?: Market, direction?: 'up' | 'down', top?: number }) {
    const date = options?.date || DateTime.local().toISODate();
    const market = options?.market || Market.TSE;
    const direction = options?.direction || 'up';
    const top = options?.top || 50;

    const results = await this.model.aggregate([
      { $match: {
          date: { $lte: date },
          type: TickerType.Equity,
          market: market || { $ne: null },
          changePercent: (direction === 'down') ? { $lt: 0 } : { $gt: 0 },
        },
      },
      { $project: { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 } },
      { $sort: { date: -1, changePercent: (direction === 'down') ? 1 : -1 } },
      { $group: { _id: '$date', data: { $push: '$$ROOT' } } },
      { $sort: { _id: -1 } },
      { $limit: 1 },
      { $unwind: '$data' },
      { $replaceRoot: { newRoot: '$data' }},
      { $limit: top },
    ]);

    return results;
  }

  async getMostActives(options?: { date?: string, market?: Market, trade?: 'volume' | 'value', top?: number }) {
    const date = options?.date || DateTime.local().toISODate();
    const market = options?.market || Market.TSE;
    const trade = options?.trade || 'volume';
    const key = (trade === 'value') ? 'tradeValue' : 'tradeVolume';
    const top = options?.top || 50;

    const results = await this.model.aggregate([
      { $match: {
          date: { $lte: date },
          type: TickerType.Equity,
          market: market || { $ne: null },
        },
      },
      { $project: { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 } },
      { $sort: { date: -1, [key]: -1 } },
      { $group: { _id: '$date', data: { $push: '$$ROOT' } } },
      { $sort: { _id: -1 } },
      { $limit: 1 },
      { $unwind: '$data' },
      { $replaceRoot: { newRoot: '$data' }},
      { $limit: top },
    ]);

    return results;
  }

  async getInstInvestorsTrades(options?: { date?: string, market?: Market, inst?: 'fini' | 'sitc' | 'dealers', net: 'buy' | 'sell', top?: number }) {
    const date = options?.date || DateTime.local().toISODate();
    const market = options?.market || Market.TSE;
    const inst = options?.inst || `fini`;
    const net = options?.net || 'buy';
    const top = options?.top || 50;
    const instKey = `${inst}NetBuySell`;

    const results = await this.model.aggregate([
      { $match: {
          date: { $lte: date },
          type: TickerType.Equity,
          market: market || { $ne: null },
          [instKey]: (net === 'sell') ? { $lt: 0 } : { $gt: 0 },
        },
      },
      { $project: { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 } },
      { $sort: { date: -1, [instKey]: (net === 'sell') ? 1 : -1 } },
      { $group: { _id: '$date', data: { $push: '$$ROOT' } } },
      { $sort: { _id: -1 } },
      { $limit: 1 },
      { $unwind: '$data' },
      { $replaceRoot: { newRoot: '$data' }},
      { $limit: top },
    ]);

    return results;
  }

  async getTickerSMAs(symbol: string, options?: { date?: string, days?: number }) {
    const date = options?.date || DateTime.local().toISODate();
    const days = options?.days || 60;

    const results = await this.model.aggregate([
      { $match: { symbol, date: { $lte: date } }},
      { $sort: { date: -1 } },
      { $project: {
          _id: 0,
          date: 1,
          open: '$openPrice',
          high: '$highPrice',
          low: '$lowPrice',
          close: '$closePrice',
          volume: '$tradeVolume',
        },
      },
      { $limit: days },
    ]);

    const values = results.map(data => data.close);

    const sma5 = SMA.calculate({ period: 5 , values });
    const sma10 = SMA.calculate({ period: 10 , values });
    const sma20 = SMA.calculate({ period: 20 , values });
    const sma60 = SMA.calculate({ period: 60 , values });

    const data = results.map((ticker, i) => ({
      ...ticker,
      sma5: sma5[i],
      sma10: sma10[i],
      sma20: sma20[i],
      sma60: sma60[i],
    }));

    return data;
  }
}
