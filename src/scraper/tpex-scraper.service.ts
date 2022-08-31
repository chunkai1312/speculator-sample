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
}
