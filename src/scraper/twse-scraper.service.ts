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
}
