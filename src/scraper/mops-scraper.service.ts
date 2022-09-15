import * as _ from 'lodash';
import * as cheerio from 'cheerio';
import * as numeral from 'numeral';
import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class MopsScraperService {
  constructor(private httpService: HttpService) { }

  async fetchQuarterlyEps(options: { market: 'sii' | 'otc' | 'rotc' | 'pub', year: number, quarter: number }) {
    const { market, year, quarter } = options;

    // 建立 FormData
    const form = new URLSearchParams({
      encodeURIComponent: '1',
      step: '1',
      firstin: '1',
      off: '1',
      isQuery: 'Y',
      TYPEK: market,
      year: numeral(year).subtract(1911).format(),
      season: numeral(quarter).format('00'),
    });
    const url = 'https://mops.twse.com.tw/mops/web/t163sb04';

    // 取得 HTML 頁面
    const page = await firstValueFrom(this.httpService.post(url, form)).then(response => response.data);

    // 使用 cheerio 載入 HTML 以取得表格的 table rows
    const $ = cheerio.load(page);

    // 遍歷每個 table row 並將其轉換成我們想要的資料格式
    const data = $('.even,.odd').map((i, el) => {
      const td = $(el).find('td');
      const symbol = td.eq(0).text().trim();  // 公司代號
      const name = td.eq(1).text().trim();  // 公司名稱
      const eps = numeral(td.eq(td.length - 1).text().trim()).value();  // 基本每股盈餘(元)
      return { symbol, name, eps, year, quarter };
    }).toArray();

    return _.orderBy(data, 'symbol', 'asc');  // 依股票代號排序
  }
}
