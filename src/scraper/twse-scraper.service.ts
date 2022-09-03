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
    // 將 `date` 轉換成 `yyyyMMdd` 格式
    const formattedDate = DateTime.fromISO(date).toFormat('yyyyMMdd');

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      response: 'json',     // 指定回應格式為 JSON
      date: formattedDate,  // 指定資料日期
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
        // [ 日期, 成交股數, 成交金額, 成交筆數, 發行量加權股價指數, 漲跌點數 ]
        const [ date, ...values ] = row;

        // 將 `民國年/MM/dd` 的日期格式轉換成 `yyyy-MM-dd`
        const [ year, month, day ] = date.split('/');
        const formatted = `${+year + 1911}${month}${day}`;
        const formattedDate = DateTime.fromFormat(formatted, 'yyyyMMdd').toISODate();

        // 轉為數字格式
        const [ tradeVolume, tradeValue, transaction, price, change ]
          = values.map(value => numeral(value).value());

        return {
          date: formattedDate,
          tradeVolume,
          tradeValue,
          transaction,
          price,
          change,
        };
      })
      .find(data => data.date === date) || null;  // 取得目標日期的成交資訊

    return data;
  }

  async fetchMarketBreadth(date: string) {
    // 將 `date` 轉換成 `yyyyMMdd` 格式
    const formattedDate = DateTime.fromISO(date).toFormat('yyyyMMdd');

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      response: 'json',     // 指定回應格式為 JSON
      date: formattedDate,  // 指定資料日期
      type: 'MS',           // 指定類別為大盤統計資訊
    });
    const url = `https://www.twse.com.tw/exchangeReport/MI_INDEX?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.stat === 'OK') && response.data);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const raw = responseData.data8.map(row => row[2]);  // 取股票市場統計
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
      unmatched: unmatched + notApplicable, // 未成交(含暫停交易)家數
    };

    return data;
  }

  async fetchInstInvestorsTrades(date: string) {
    // 將 `date` 轉換成 `yyyyMMdd` 格式
    const formattedDate = DateTime.fromISO(date).toFormat('yyyyMMdd');

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      response: 'json',         // 指定回應格式為 JSON
      dayDate: formattedDate,   // 指定資料日期
      type: 'day',              // 指定輸出日報表
    });
    const url = `https://www.twse.com.tw/fund/BFI82U?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.stat === 'OK') && response.data);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const raw = responseData.data
      .map(data => data.slice(1)).flat()  // 取出買賣金額並減少一層陣列嵌套
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

    // 計算外資合計買進金額
    const foreignInvestorsBuy = foreignDealersExcludedBuy + foreignDealersBuy;

    // 外資合計賣出金額
    const foreignInvestorsSell = foreignDealersExcludedSell + foreignDealersSell;

    // 計算外資合計買賣超
    const foreignInvestorsNetBuySell = foreignDealersExcludedNetBuySell + foreignDealersNetBuySell;

    // 計算自營商合計買進金額
    const dealersBuy = dealersProprietaryBuy + dealersHedgeBuy;

    // 計算自營商合計賣出金額
    const dealersSell = dealersProprietarySell + dealersHedgeSell;

    // 計算自營商合計買賣超
    const dealersNetBuySell = dealersProprietaryNetBuySell + dealersHedgeNetBuySell;

    return {
      date,
      foreignDealersExcludedBuy,
      foreignDealersExcludedSell,
      foreignDealersExcludedNetBuySell,
      foreignDealersBuy,
      foreignDealersSell,
      foreignDealersNetBuySell,
      foreignInvestorsBuy,
      foreignInvestorsSell,
      foreignInvestorsNetBuySell,
      sitcBuy,
      sitcSell,
      sitcNetBuySell,
      dealersProprietaryBuy,
      dealersProprietarySell,
      dealersProprietaryNetBuySell,
      dealersHedgeBuy,
      dealersHedgeSell,
      dealersHedgeNetBuySell,
      dealersBuy,
      dealersSell,
      dealersNetBuySell,
    };
  }

  async fetchMarginTransactions(date: string) {
    // 將 `date` 轉換成 `yyyyMMdd` 格式
    const formattedDate = DateTime.fromISO(date).toFormat('yyyyMMdd');

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      response: 'json',     // 指定回應格式為 JSON
      date: formattedDate,  // 指定資料日期
      selectType: 'MS',     // 指定分類項目為信用交易統計
    });
    const url = `https://www.twse.com.tw/en/exchangeReport/MI_MARGN?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.stat === 'OK') ? response.data : null);

    // 若該日期非交易日或尚無信用交易統計則回傳 null
    if (!responseData) return null;
    if (!responseData.creditList.length) return null;

    // 整理回應資料
    const raw = responseData.creditList
      .map(data => data.slice(1)).flat()  // 取出買賣金額並減少一層陣列嵌套
      .map(data => numeral(data).value() || +data); // 轉為數字格式

    const [
      marginPurchase,           // 融資(交易單位)-買進
      marginSale,               // 融資(交易單位)-賣出
      cashRedemption,           // 融資(交易單位)-現金(券)償還
      marginBalancePrev,        // 融資(交易單位)-前日餘額
      marginBalance,            // 融資(交易單位)-今日餘額
      shortCovering,            // 融券(交易單位)-買進
      shortSale,                // 融券(交易單位)-賣出
      stockRedemption,          // 融券(交易單位)-現金(券)償還
      shortBalancePrev,         // 融券(交易單位)-前日餘額
      shortBalance,             // 融券(交易單位)-今日餘額
      marginPurchaseValue,      // 融資金額(仟元)-買進
      marginSaleValue,          // 融資金額(仟元)-賣出
      cashRedemptionValue,      // 融資金額(仟元)-現金(券)償還
      marginBalanceValuePrev,   // 融資金額(仟元)-前日餘額
      marginBalanceValue,       // 融資金額(仟元)-今日餘額
    ] = raw;

    // 計算融資餘額增減(交易單位)
    const marginChange = marginBalance - marginBalancePrev;

    // 計算融資餘額增減(仟元)
    const marginChangeValue = marginBalanceValue - marginBalanceValuePrev;

    // 計算融券餘額增減(交易單位)
    const shortChange = shortBalance - shortBalancePrev;

    return {
      date,
      marginBalance,
      marginChange,
      marginBalanceValue,
      marginChangeValue,
      shortBalance,
      shortChange,
    };
  }
}
