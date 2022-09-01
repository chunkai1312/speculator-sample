import * as numeral from 'numeral';
import { DateTime } from 'luxon';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TpexScraperService {
  constructor(private httpService: HttpService) {}

  async fetchMarketTrades(date: string) {
    const dt = DateTime.fromISO(date);
    const formattedDate = `${dt.get('year') - 1911}/${dt.toFormat('MM')}`;  //將 ISO Date 轉換成 `民國年/MM` 格式
    const query = new URLSearchParams({   // 建立 URL 查詢參數
      l: 'zh-tw',                         // 指定語系為正體中文
      d: formattedDate,                   // 指定日期
      o: 'json',                          // 指定回應格式為 JSON
    });
    const url = `https://www.tpex.org.tw/web/stock/aftertrading/daily_trading_index/st41_result.php?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.iTotalRecords > 0) && response.data);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const data = responseData.aaData.map(row => {
      const [ date, ...values ] = row;  // [ 日期, 成交股數, 金額, 筆數, 櫃買指數, 漲/跌 ]

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
    const dt = DateTime.fromISO(date);
    const formattedDate = `${dt.get('year') - 1911}/${dt.toFormat('MM/dd')}`;  //將 ISO Date 轉換成 `民國年/MM/dd` 格式
    const query = new URLSearchParams({   // 建立 URL 查詢參數
      l: 'zh-tw',                         // 指定語系為正體中文
      d: formattedDate,                   // 指定日期
      o: 'json',                          // 指定回應格式為 JSON
    });
    const url = `https://www.tpex.org.tw/web/stock/aftertrading/market_highlight/highlight_result.php?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.iTotalRecords > 0) && response.data);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    const { upNum, upStopNum, downNum, downStopNum, noChangeNum, noTradeNum } = responseData;

    // 整理回應資料
    const [ up, limitUp, down, limitDown, unchanged, unmatched ] = [
      upNum, upStopNum, downNum, downStopNum, noChangeNum, noTradeNum
    ].map(value => numeral(value).value());   // 轉為數字格式

    const data = {
      date,
      up,
      limitUp,
      down,
      limitDown,
      unchanged,
      unmatched,
    };

    return data;
  }

  async fetchInstInvestorsTrades(date: string) {
    const dt = DateTime.fromISO(date);
    const formattedDate = `${dt.get('year') - 1911}/${dt.toFormat('MM')}/${dt.toFormat('dd')}`; // 將 ISO Date 格式轉換成 `民國年/MM/dd`
    const query = new URLSearchParams({   // 建立 URL 查詢參數
      l: 'zh-tw',                         // 指定語系為正體中文
      t: 'D',                             // 輸出日報表
      d: formattedDate,                   // 指定日期
      o: 'json',                          // 指定回應格式為 JSON
    });
    const url = `https://www.tpex.org.tw/web/stock/3insti/3insti_summary/3itrdsum_result.php?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.iTotalRecords > 0) && response.data);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const raw = responseData.aaData
      .map(data => data.slice(1)).flat()              // 取買賣金額並減少一層陣列嵌套
      .map(data => numeral(data).value() || +data);   // 轉為數字格式

    const [
      foreignInvestorsBuy,                // 外資及陸資合計買進金額
      foreignInvestorsSell,               // 外資及陸資合計賣出金額
      foreignInvestorsNetBuySell,         // 外資及陸資合計買賣超
      foreignDealersExcludedBuy,          // 外資及陸資(不含自營商)買進金額
      foreignDealersExcludedSell,         // 外資及陸資(不含自營商)賣出金額
      foreignDealersExcludedNetBuySell,   // 外資及陸資(不含自營商)買賣超
      foreignDealersBuy,                  // 外資自營商買進金額
      foreignDealersSell,                 // 外資自營商賣出金額
      foreignDealersNetBuySell,           // 外資自營商買賣超
      sitcBuy,                            // 投信買進金額
      sitcSell,                           // 投信賣出金額
      sitcNetBuySell,                     // 投信買賣超
      dealersBuy,                         // 自營商合計買進金額
      dealersSell,                        // 自營商合計賣出金額
      dealersNetBuySell,                  // 自營商合計買賣超
      dealersProprietaryBuy,              // 自營商(自行買賣)買進金額
      dealersProprietarySell,             // 自營商(自行買賣)賣出金額
      dealersProprietaryNetBuySell,       // 自營商(自行買賣)買賣超
      dealersHedgeBuy,                    // 自營商(避險)買進金額
      dealersHedgeSell,                   // 自營商(避險)賣出金額
      dealersHedgeNetBuySell,             // 自營商(避險)買賣超
    ] = raw;

    return {
      date,
      dealersProprietaryBuy,
      dealersProprietarySell,
      dealersProprietaryNetBuySell,
      dealersHedgeBuy,
      dealersHedgeSell,
      dealersHedgeNetBuySell,
      dealersBuy,
      dealersSell,
      dealersNetBuySell,
      sitcBuy,
      sitcSell,
      sitcNetBuySell,
      foreignDealersExcludedBuy,
      foreignDealersExcludedSell,
      foreignDealersExcludedNetBuySell,
      foreignDealersBuy,
      foreignDealersSell,
      foreignDealersNetBuySell,
      foreignInvestorsBuy,
      foreignInvestorsSell,
      foreignInvestorsNetBuySell,
    };
  }
}
