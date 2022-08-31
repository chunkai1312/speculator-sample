import * as cheerio from 'cheerio';
import * as iconv from 'iconv-lite';
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
}
