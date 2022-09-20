import { DateTime } from 'luxon';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MarketStats, MarketStatsDocument } from './market-stats.schema';

@Injectable()
export class MarketStatsRepository {
  constructor(
    @InjectModel(MarketStats.name) private readonly model: Model<MarketStatsDocument>,
  ) {}

  async updateMarketStats(marketStats: Partial<MarketStats>) {
    const { date } = marketStats;
    return this.model.updateOne({ date }, marketStats, { upsert: true });
  }

  async getMarketStats(options?: { days?: number, date?: string }) {
    const date = options?.date || DateTime.local().toISODate();
    const days = options?.days || 30;

    const results = await this.model.aggregate([
      { $match: { date: { $lte: date } } },
      { $project: { _id: 0, __v: 0, createdAt: 0 , updatedAt: 0 } },
      { $sort: { date: -1 } },
      { $limit: days + 1 },
    ]);

    const data = results.map((doc, i) => (i < results.length - 1 ? {
      ...doc,
      taiexChangePercent: doc.taiexPrice && Math.round((doc.taiexChange / (doc.taiexPrice - doc.taiexChange)) * 10000) / 100,
      usdtwdChange: doc.usdtwd && parseFloat((doc.usdtwd - results[i + 1].usdtwd).toPrecision(12)),
      finiTxfNetOiChange: doc.finiTxfNetOi && (doc.finiTxfNetOi - results[i + 1].finiTxfNetOi),
      finiTxoCallsNetOiValueChange: doc.finiTxoCallsNetOiValue && (doc.finiTxoCallsNetOiValue - results[i + 1].finiTxoCallsNetOiValue),
      finiTxoPutsNetOiValueChange: doc.finiTxoPutsNetOiValue && (doc.finiTxoPutsNetOiValue - results[i + 1].finiTxoPutsNetOiValue),
      top10SpecificTxfFrontMonthNetOiChange: doc.top10SpecificTxfFrontMonthNetOi && (doc.top10SpecificTxfFrontMonthNetOi - results[i + 1].top10SpecificTxfFrontMonthNetOi),
      top10SpecificTxfBackMonthsNetOiChange: doc.top10SpecificTxfBackMonthsNetOi && (doc.top10SpecificTxfBackMonthsNetOi - results[i + 1].top10SpecificTxfBackMonthsNetOi),
      retailMxfNetOiChange: doc.retailMxfNetOi && (doc.retailMxfNetOi - results[i + 1].retailMxfNetOi),
    } : doc)).slice(0, -1);

    return data;
  }
}
