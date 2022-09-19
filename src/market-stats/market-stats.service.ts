import { DateTime } from 'luxon';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MarketStatsRepository } from './market-stats.repository';
import { TwseScraperService } from '../scraper/twse-scraper.service';
import { TaifexScraperService } from '../scraper/taifex-scraper.service';

@Injectable()
export class MarketStatsService {
  constructor(
    private readonly marketStatsRepository: MarketStatsRepository,
    private readonly twseScraperService: TwseScraperService,
    private readonly taifexScraperService: TaifexScraperService,
  ) {}

  async updateMarketStats(date: string = DateTime.local().toISODate()) {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await this.updateTaiex(date).then(() => delay(5000));
    await this.updateInstInvestorsTrades(date).then(() => delay(5000));
    await this.updateMarginTransactions(date).then(() => delay(5000));
    await this.updateFiniTxfNetOi(date).then(() => delay(5000));
    await this.updateFiniTxoNetOiValue(date).then(() => delay(5000));
    await this.updateLargeTradersTxfNetOi(date).then(() => delay(5000));
    await this.updateRetailMxfPosition(date).then(() => delay(5000));
    await this.updateTxoPutCallRatio(date).then(() => delay(5000));
    await this.updateUsdTwdRate(date).then(() => delay(5000));

    Logger.log(`${date} 已完成`, MarketStatsService.name);
  }

  @Cron('0 0 15 * * *')
  async updateTaiex(date: string = DateTime.local().toISODate()) {
    const updated = await this.twseScraperService.fetchMarketTrades(date)
      .then(data => data && {
        date,
        taiexPrice: data.price,
        taiexChange: data.change,
        taiexTradeValue: data.tradeValue,
      })
      .then(data => data && this.marketStatsRepository.updateMarketStats(data))

    if (updated) Logger.log(`${date} 集中市場加權指數: 已更新`, MarketStatsService.name);
    else Logger.warn(`${date} 集中市場加權指數: 尚無資料或非交易日`, MarketStatsService.name);
  }

  @Cron('0 30 15 * * *')
  async updateInstInvestorsTrades(date: string = DateTime.local().toISODate()) {
    const updated = await this.twseScraperService.fetchInstInvestorsTrades(date)
      .then(data => data && {
        date,
        finiNetBuySell: data.foreignInvestorsNetBuySell,
        sitcNetBuySell: data.sitcNetBuySell,
        dealersNetBuySell: data.dealersNetBuySell,
      })
      .then(data => data && this.marketStatsRepository.updateMarketStats(data))

    if (updated) Logger.log(`${date} 集中市場三大法人買賣超: 已更新`, MarketStatsService.name);
    else Logger.warn(`${date} 集中市場三大法人買賣超: 尚無資料或非交易日`, MarketStatsService.name);
  }

  @Cron('0 30 21 * * *')
  async updateMarginTransactions(date: string = DateTime.local().toISODate()) {
    const updated = await this.twseScraperService.fetchMarginTransactions(date)
      .then(data => data && {
        date,
        marginBalance: data.marginBalance,
        marginBalanceChange: data.marginBalanceChange,
        shortBalance: data.shortBalance,
        shortBalanceChange: data.shortBalanceChange,
      })
      .then(data => data && this.marketStatsRepository.updateMarketStats(data));

    if (updated) Logger.log(`${date} 集中市場信用交易: 已更新`, MarketStatsService.name);
    else Logger.warn(`${date} 集中市場信用交易: 尚無資料或非交易日`, MarketStatsService.name);
  }

  @Cron('0 0 15 * * *')
  async updateFiniTxfNetOi(date: string = DateTime.local().toISODate()) {
    const updated = await this.taifexScraperService.fetchInstInvestorsTxfTrades(date)
      .then(data => data && {
        date,
        finiTxfNetOi: data.finiNetOiVolume,
      })
      .then(data => data && this.marketStatsRepository.updateMarketStats(data));

    if (updated) Logger.log(`${date} 外資臺股期貨未平倉淨口數: 已更新`, MarketStatsService.name);
    else Logger.warn(`${date} 外資臺股期貨未平倉淨口數: 尚無資料或非交易日`, MarketStatsService.name);
  }

  @Cron('5 0 15 * * *')
  async updateFiniTxoNetOiValue(date: string = DateTime.local().toISODate()) {
    const updated = await this.taifexScraperService.fetchInstInvestorsTxoTrades(date)
      .then(data => data && {
        date,
        finiTxoCallsNetOiValue: data.finiCallsNetOiValue,
        finiTxoPutsNetOiValue: data.finiPutsNetOiValue,
      })
      .then(data => data && this.marketStatsRepository.updateMarketStats(data));

    if (updated) Logger.log(`${date} 外資臺指選擇權未平倉淨金額: 已更新`, MarketStatsService.name);
    else Logger.warn(`${date} 外資臺指選擇權未平倉淨金額: 尚無資料或非交易日`, MarketStatsService.name);
  }

  @Cron('10 0 15 * * *')
  async updateLargeTradersTxfNetOi(date: string = DateTime.local().toISODate()) {
    const updated = await this.taifexScraperService.fetchLargeTradersTxfPosition(date)
      .then(data => data && {
        date,
        top10SpecificTxfFrontMonthNetOi: data.top10SpecificFrontMonthNetOi,
        top10SpecificTxfBackMonthsNetOi: data.top10SpecificBackMonthsNetOi,
      })
      .then(data => data && this.marketStatsRepository.updateMarketStats(data));

    if (updated) Logger.log(`${date} 十大特法臺股期貨未平倉淨口數: 已更新`, MarketStatsService.name);
    else Logger.warn(`${date} 十大特法臺股期貨未平倉淨口數: 尚無資料或非交易日`, MarketStatsService.name);
  }

  @Cron('15 0 15 * * *')
  async updateRetailMxfPosition(date: string = DateTime.local().toISODate()) {
    const updated = await this.taifexScraperService.fetchRetailMxfPosition(date)
      .then(data => data && {
        date,
        retailMxfNetOi: data.retailMxfNetOi,
        retailMxfLongShortRatio: data.retailMxfLongShortRatio,
      })
      .then(data => data && this.marketStatsRepository.updateMarketStats(data));

    if (updated) Logger.log(`${date} 散戶小台淨部位: 已更新`, MarketStatsService.name);
    else Logger.warn(`${date} 散戶小台淨部位: 尚無資料或非交易日`, MarketStatsService.name);
  }

  @Cron('20 0 15 * * *')
  async updateTxoPutCallRatio(date: string = DateTime.local().toISODate()) {
    const updated = await this.taifexScraperService.fetchTxoPutCallRatio(date)
      .then(data => data && {
        date,
        txoPutCallRatio: data.txoPutCallRatio,
      })
      .then(data => data && this.marketStatsRepository.updateMarketStats(data));

    if (updated) Logger.log(`${date} 臺指選擇權 Put/Call Ratio: 已更新`, MarketStatsService.name);
    else Logger.warn(`${date} 臺指選擇權 Put/Call Ratio: 尚無資料或非交易日`, MarketStatsService.name);
  }

  @Cron('0 0 17 * * *')
  async updateUsdTwdRate(date: string = DateTime.local().toISODate()) {
    const updated = await this.taifexScraperService.fetchExchangeRates(date)
      .then(data => data && {
        date,
        usdtwd: data.usdtwd,
      })
      .then(data => data && this.marketStatsRepository.updateMarketStats(data));

    if (updated) Logger.log(`${date} 美元兌新臺幣匯率: 已更新`, MarketStatsService.name);
    else Logger.warn(`${date} 美元兌新臺幣匯率: 尚無資料或非交易日`, MarketStatsService.name);
  }
}
