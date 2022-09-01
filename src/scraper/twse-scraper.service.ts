import * as cheerio from 'cheerio';
import * as iconv from 'iconv-lite';
import * as numeral from 'numeral';
import { DateTime } from 'luxon';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TwseScraperService {
  constructor(private httpService: HttpService) {}

  async fetchListedStocks(options?: { market: 'TSE' | 'OTC' }) {
    const url = options?.market === 'OTC'
      ? 'https://isin.twse.com.tw/isin/class_main.jsp?market=2&issuetype=4'
      : 'https://isin.twse.com.tw/isin/class_main.jsp?market=1&issuetype=1';

    // 取得 HTML 並轉換為 Big-5 編碼
    const page = await firstValueFrom(this.httpService.get(url, { responseType: 'arraybuffer' }))
      .then(response => iconv.decode(response.data, 'big5'));

    // 使用 cheerio 載入 HTML 以取得表格的 table rows
    const $ = cheerio.load(page);
    const rows = $('.h4 tr');

    // 遍歷每個 table row 並將其轉換成我們想要的資料格式
    const data = rows.slice(1).map((i, el) => {
      const td = $(el).find('td');
      return {
        symbol: td.eq(2).text().trim(),   // 股票代碼
        name: td.eq(3).text().trim(),     // 股票名稱
        market: td.eq(4).text().trim(),   // 市場別
        industry: td.eq(6).text().trim(), // 產業別
      };
    }).toArray();

    return data;
  }

  async fetchMarketTrades(date: string) {
    const query = new URLSearchParams({                   // 建立 Query 參數
      response: 'json',                                   // 指定回應格式為 JSON
      date: DateTime.fromISO(date).toFormat('yyyyMMdd'),  // 將 ISO Date 轉換成 `yyyyMMdd` 格式
    });
    const url = `https://www.twse.com.tw/exchangeReport/FMTQIK?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.stat === 'OK') && response.data);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const data = responseData.data
      .map(row => {
        const [ date, ...values ] = row;  // [ 日期, 成交股數, 成交金額, 成交筆數, 發行量加權股價指數, 漲跌點數 ]

        // 將 `民國年/MM/dd` 的日期格式轉換成 `yyyy-MM-dd`
        const [ year, month, day ] = date.split('/');
        const formattedDate = DateTime.fromFormat(`${+year + 1911}${month}${day}`, 'yyyyMMdd').toISODate();

        // 轉為數字格式
        const [ tradeVolume, tradeValue, transaction, price, change ] = values.map(value => numeral(value).value());

        return { date: formattedDate, tradeVolume, tradeValue, transaction, price, change };
      })
      .find(data => data.date === date) || null;  // 取得目標日期的成交資訊

    return data;
  }

  async fetchMarketBreadth(date: string) {
    const query = new URLSearchParams({                   // 建立 Query 參數
      response: 'json',                                   // 指定回應格式為 JSON
      date: DateTime.fromISO(date).toFormat('yyyyMMdd'),  // 將 ISO Date 轉換成 `yyyyMMdd` 格式
      type: 'MS',                                         // 指定類別為大盤統計資訊
    });
    const url = `https://www.twse.com.tw/exchangeReport/MI_INDEX?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.stat === 'OK') && response.data);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    const raw = responseData.data8.map(row => row[2]); // 取股票市場統計

    // 整理回應資料
    const [ up, limitUp, down, limitDown, unchanged, unmatched, notApplicable ] = [
      ...raw[0].replace(')', '').split('('),  // 取出漲停家數
      ...raw[1].replace(')', '').split('('),  // 取出漲停家數
      ...raw.slice(2),
    ].map(value => numeral(value).value());   // 轉為數字格式

    const data = {
      date,
      up,
      limitUp,
      down,
      limitDown,
      unchanged,
      unmatched: unmatched + notApplicable, // 合併未成交及未比價
    };

    return data;
  }

  async fetchInstInvestorsTrades(date: string) {
    const query = new URLSearchParams({                       // 建立 Query 參數
      response: 'json',                                       // 指定回應格式為 JSON
      dayDate: DateTime.fromISO(date).toFormat('yyyyMMdd'),   // 將 ISO Date 格式轉換成 `yyyyMMdd`
      type: 'day',                                            // 輸出日報表
    });
    const url = `https://www.twse.com.tw/fund/BFI82U?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.stat === 'OK') && response.data);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const raw = responseData.data
      .map(data => data.slice(1)).flat()              // 取買賣金額並減少一層陣列嵌套
      .map(data => numeral(data).value() || +data);   // 轉為數字格式

    const [
      dealersProprietaryBuy,            // 自營商(自行買賣)買進金額
      dealersProprietarySell,           // 自營商(自行買賣)賣出金額
      dealersProprietaryNetBuySell,     // 自營商(自行買賣)買賣超
      dealersHedgeBuy,                  // 自營商(避險)買進金額
      dealersHedgeSell,                 // 自營商(避險)賣出金額
      dealersHedgeNetBuySell,           // 自營商(避險)買賣超
      sitcBuy,                          // 投信買進金額
      sitcSell,                         // 投信賣出金額
      sitcNetBuySell,                   // 投信買賣超
      foreignDealersExcludedBuy,        // 外資及陸資(不含外資自營商)買進金額
      foreignDealersExcludedSell,       // 外資及陸資(不含外資自營商)賣出金額
      foreignDealersExcludedNetBuySell, // 外資及陸資(不含外資自營商)買賣超
      foreignDealersBuy,                // 外資自營商買進金額
      foreignDealersSell,               // 外資自營商賣出金額
      foreignDealersNetBuySell,         // 外資自營商買賣超
    ] = raw;

    const foreignInvestorsBuy = foreignDealersExcludedBuy + foreignDealersBuy;                      // 外資買進金額
    const foreignInvestorsSell = foreignDealersExcludedSell + foreignDealersSell;                   // 外資賣出金額
    const foreignInvestorsNetBuySell = foreignDealersExcludedNetBuySell + foreignDealersNetBuySell; // 外資買賣超
    const dealersBuy = dealersProprietaryBuy + dealersHedgeBuy;                                     // 自營商買進金額
    const dealersSell = dealersProprietarySell + dealersHedgeSell;                                  // 自營商賣出金額
    const dealersNetBuySell = dealersProprietaryNetBuySell + dealersHedgeNetBuySell;                // 自營商買賣超

    return {
      date,
      dealersProprietaryBuy,            // 自營商(自行買賣)買進金額
      dealersProprietarySell,           // 自營商(自行買賣)賣出金額
      dealersProprietaryNetBuySell,     // 自營商(自行買賣)買賣超
      dealersHedgeBuy,                  // 自營商(避險)買進金額
      dealersHedgeSell,                 // 自營商(避險)賣出金額
      dealersHedgeNetBuySell,           // 自營商(避險)買賣超
      sitcBuy,                          // 投信買進金額
      sitcSell,                         // 投信賣出金額
      sitcNetBuySell,                   // 投信買賣超
      foreignDealersExcludedBuy,        // 外資及陸資(不含外資自營商)買進金額
      foreignDealersExcludedSell,       // 外資及陸資(不含外資自營商)賣出金額
      foreignDealersExcludedNetBuySell, // 外資及陸資(不含外資自營商)買賣超
      foreignDealersBuy,                // 外資自營商買進金額
      foreignDealersSell,               // 外資自營商賣出金額
      foreignDealersNetBuySell,         // 外資自營商買賣超
      foreignInvestorsBuy,              // 外資買進金額
      foreignInvestorsSell,             // 外資賣出金額
      foreignInvestorsNetBuySell,       // 外資買賣超
      dealersBuy,                       // 自營商買進金額
      dealersSell,                      // 自營商賣出金額
      dealersNetBuySell,                // 自營商買賣超
    };
  }
}
