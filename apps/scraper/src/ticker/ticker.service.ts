import { DateTime } from 'luxon';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TickerType, Exchange, Market, Index } from '@speculator/common';
import { TickerRepository } from './ticker.repository';
import { TwseScraperService } from '../scraper/twse-scraper.service';
import { TpexScraperService } from '../scraper/tpex-scraper.service';

@Injectable()
export class TickerService {
  constructor(
    private readonly tickerRepository: TickerRepository,
    private readonly twseScraperService: TwseScraperService,
    private readonly tpexScraperService: TpexScraperService,
  ) {}

  async updateTickers(date: string = DateTime.local().toISODate()) {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await Promise.all([
      this.updateTwseIndicesQuotes(date),
      this.updateTpexIndicesQuotes(date),
    ]).then(() => delay(5000));

    await Promise.all([
      this.updateTwseMarketTrades(date),
      this.updateTpexMarketTrades(date),
    ]).then(() => delay(5000));

    await Promise.all([
      this.updateTwseIndicesTrades(date),
      this.updateTpexIndicesTrades(date),
    ]).then(() => delay(5000));

    await Promise.all([
      this.updateTwseEquitiesQuotes(date),
      this.updateTpexEquitiesQuotes(date),
    ]).then(() => delay(5000));

    await Promise.all([
      this.updateTwseEquitiesInstInvestorsTrades(date),
      this.updateTpexEquitiesInstInvestorsTrades(date),
    ]).then(() => delay(5000));

    Logger.log(`${date} 已完成`, TickerService.name);
  }

  @Cron('0 0 14 * * *')
  async updateTwseIndicesQuotes(date: string = DateTime.local().toISODate()) {
    const updated = await this.twseScraperService.fetchIndicesQuotes(date)
      .then(data => data && data.map(ticker => ({
        date: ticker.date,
        type: TickerType.Index,
        exchange: Exchange.TWSE,
        market: Market.TSE,
        symbol: ticker.symbol,
        name: ticker.name,
        openPrice: ticker.openPrice,
        highPrice: ticker.highPrice,
        lowPrice: ticker.lowPrice,
        closePrice: ticker.closePrice,
        change: ticker.change,
        changePercent: ticker.changePercent,
      })))
      .then(data => data && Promise.all(data.map(ticker => this.tickerRepository.updateTicker(ticker))));

    if (updated) Logger.log(`${date} 上市指數收盤行情: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上市指數收盤行情: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 0 14 * * *')
  async updateTpexIndicesQuotes(date: string = DateTime.local().toISODate()) {
    const updated = await this.tpexScraperService.fetchIndicesQuotes(date)
      .then(data => data && data.map(ticker => ({
        date: ticker.date,
        type: TickerType.Index,
        exchange: Exchange.TPEx,
        market: Market.OTC,
        symbol: ticker.symbol,
        name: ticker.name,
        openPrice: ticker.openPrice,
        highPrice: ticker.highPrice,
        lowPrice: ticker.lowPrice,
        closePrice: ticker.closePrice,
        change: ticker.change,
        changePercent: ticker.changePercent,
      })))
      .then(data => data && Promise.all(data.map(ticker => this.tickerRepository.updateTicker(ticker))));

    if (updated) Logger.log(`${date} 上櫃指數收盤行情: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上櫃指數收盤行情: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 30 14 * * *')
  async updateTwseMarketTrades(date: string = DateTime.local().toISODate()) {
    const updated = await this.twseScraperService.fetchMarketTrades(date)
      .then(data => data && {
        date,
        type: TickerType.Index,
        exchange: Exchange.TWSE,
        market: Market.TSE,
        symbol: Index.TAIEX,
        tradeVolume: data.tradeVolume,
        tradeValue: data.tradeValue,
        transaction: data.transaction,
      })
      .then(ticker => ticker && this.tickerRepository.updateTicker(ticker));

    if (updated) Logger.log(`${date} 上市大盤成交量值: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上市大盤成交量值: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 30 14 * * *')
  async updateTpexMarketTrades(date: string = DateTime.local().toISODate()) {
    const updated = await this.tpexScraperService.fetchMarketTrades(date)
      .then(data => data && {
        date,
        type: TickerType.Index,
        exchange: Exchange.TPEx,
        market: Market.OTC,
        symbol: Index.TPEX,
        tradeVolume: data.tradeVolume,
        tradeValue: data.tradeValue,
        transaction: data.transaction,
      })
      .then(ticker => ticker && this.tickerRepository.updateTicker(ticker));

    if (updated) Logger.log(`${date} 上櫃大盤成交量值: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上櫃大盤成交量值: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 0 15 * * *')
  async updateTwseIndicesTrades(date: string = DateTime.local().toISODate()) {
    const updated = await this.twseScraperService.fetchIndicesTrades(date)
      .then(data => data && data.map(ticker => ({
        date: ticker.date,
        type: TickerType.Index,
        exchange: Exchange.TWSE,
        market: Market.TSE,
        symbol: ticker.symbol,
        tradeVolume: ticker.tradeVolume,
        tradeValue: ticker.tradeValue,
        tradeWeight: ticker.tradeWeight,
      })))
      .then(data => data && Promise.all(data.map(ticker => this.tickerRepository.updateTicker(ticker))));

    if (updated) Logger.log(`${date} 上市類股成交量值: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上市類股成交量值: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 0 15 * * *')
  async updateTpexIndicesTrades(date: string = DateTime.local().toISODate()) {
    const updated = await this.tpexScraperService.fetchIndicesTrades(date)
      .then(data => data && data.map(ticker => ({
        date: ticker.date,
        type: TickerType.Index,
        exchange: Exchange.TPEx,
        market: Market.OTC,
        symbol: ticker.symbol,
        tradeVolume: ticker.tradeVolume,
        tradeValue: ticker.tradeValue,
        tradeWeight: ticker.tradeWeight,
      })))
      .then(data => data && Promise.all(data.map(ticker => this.tickerRepository.updateTicker(ticker))));

    if (updated) Logger.log(`${date} 上櫃類股成交量值: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上櫃類股成交量值: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 0 15-21/2 * * *')
  async updateTwseEquitiesQuotes(date: string = DateTime.local().toISODate()) {
    const updated = await this.twseScraperService.fetchEquitiesQuotes(date)
      .then(data => data && data.map(ticker => ({
        date: ticker.date,
        type: TickerType.Equity,
        exchange: Exchange.TWSE,
        market: Market.TSE,
        symbol: ticker.symbol,
        name: ticker.name,
        openPrice: ticker.openPrice,
        highPrice: ticker.highPrice,
        lowPrice: ticker.lowPrice,
        closePrice: ticker.closePrice,
        change: ticker.change,
        changePercent: ticker.changePercent,
        tradeVolume: ticker.tradeVolume,
        tradeValue: ticker.tradeValue,
        transaction: ticker.transaction,
      })))
      .then(data => data && Promise.all(data.map(ticker => this.tickerRepository.updateTicker(ticker))));

    if (updated) Logger.log(`${date} 上市個股收盤行情: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上市個股收盤行情: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 0 15-21/2 * * *')
  async updateTpexEquitiesQuotes(date: string = DateTime.local().toISODate()) {
    const updated = await this.tpexScraperService.fetchEquitiesQuotes(date)
      .then(data => data && data.map(ticker => ({ ...ticker,
        date: ticker.date,
        type: TickerType.Equity,
        exchange: Exchange.TPEx,
        market: Market.OTC,
        symbol: ticker.symbol,
        name: ticker.name,
        openPrice: ticker.openPrice,
        highPrice: ticker.highPrice,
        lowPrice: ticker.lowPrice,
        closePrice: ticker.closePrice,
        change: ticker.change,
        changePercent: ticker.changePercent,
        tradeVolume: ticker.tradeVolume,
        tradeValue: ticker.tradeValue,
        transaction: ticker.transaction,
      })))
      .then(data => data && Promise.all(data.map(ticker => this.tickerRepository.updateTicker(ticker))));

    if (updated) Logger.log(`${date} 上櫃個股收盤行情: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上櫃個股收盤行情: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 30 16 * * *')
  async updateTwseEquitiesInstInvestorsTrades(date: string = DateTime.local().toISODate()) {
    const updated = await this.twseScraperService.fetchEquitiesInstInvestorsTrades(date)
      .then(data => data && data.map(ticker => ({
        date: ticker.date,
        type: TickerType.Equity,
        exchange: Exchange.TWSE,
        market: Market.TSE,
        symbol: ticker.symbol,
        finiNetBuySell: ticker.foreignInvestorsNetBuySell,
        sitcNetBuySell: ticker.sitcNetBuySell,
        dealersNetBuySell: ticker.dealersNetBuySell,
      })))
      .then(data => data && Promise.all(data.map(ticker => this.tickerRepository.updateTicker(ticker))));

    if (updated) Logger.log(`${date} 上市個股法人進出: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上市個股法人進出: 尚無資料或非交易日`, TickerService.name);
  }

  @Cron('0 30 16 * * *')
  async updateTpexEquitiesInstInvestorsTrades(date: string = DateTime.local().toISODate()) {
    const updated = await this.tpexScraperService.fetchEquitiesInstInvestorsTrades(date)
      .then(data => data && data.map(ticker => ({
        date: ticker.date,
        type: TickerType.Equity,
        exchange: Exchange.TPEx,
        market: Market.OTC,
        symbol: ticker.symbol,
        finiNetBuySell: ticker.foreignInvestorsNetBuySell,
        sitcNetBuySell: ticker.sitcNetBuySell,
        dealersNetBuySell: ticker.dealersNetBuySell,
      })))
      .then(data => data && Promise.all(data.map(ticker => this.tickerRepository.updateTicker(ticker))));

    if (updated) Logger.log(`${date} 上櫃個股法人進出: 已更新`, TickerService.name);
    else Logger.warn(`${date} 上櫃個股法人進出: 尚無資料或非交易日`, TickerService.name);
  }
}
