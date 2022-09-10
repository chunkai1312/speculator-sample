import * as csvtojson from 'csvtojson';
import * as numeral from 'numeral';
import { DateTime } from 'luxon';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsdtScraperService {
  constructor(private httpService: HttpService) {}

  async fetchUsTreasuryYields(date: string) {
    const dt = DateTime.fromISO(date);
    const month = dt.toFormat('yyyyMM');
    const url = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/all/${month}?type=daily_treasury_yield_curve&field_tdr_date_value_month=${month}&page&_format=csv`

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => csvtojson({ noheader: true, output: 'csv' }).fromString(response.data));

    // 若尚無資料則回傳 null
    const [ fields, ...rows ] = responseData;
    if (fields[0] !== 'Date') return null;

    const data = rows.map(row => {
      // 轉換日期格式
      const date = DateTime.fromFormat(row[0], 'MM/dd/yyyy').toISODate()

      // 將 string 型別數字轉換成 number
      const raw = row.slice(1).map(data => numeral(data).value());

      const [
        us1m,   // 美國 1 個月期公債殖利率
        us2m,   // 美國 2 個月期公債殖利率
        us3m,   // 美國 3 個月期公債殖利率
        us6m,   // 美國 6 個月期公債殖利率
        us1y,   // 美國 1 年期公債殖利率
        us2y,   // 美國 2 年期公債殖利率
        us3y,   // 美國 3 年期公債殖利率
        us5y,   // 美國 5 年期公債殖利率
        us7y,   // 美國 7 年期公債殖利率
        us10y,  // 美國 10 年期公債殖利率
        us20y,  // 美國 20 年期公債殖利率
        us30y,  // 美國 30 年期公債殖利率
      ] = raw;

      return { date, us1m, us2m, us3m, us6m, us1y, us2y, us3y, us5y, us7y, us10y, us20y, us30y };
    }).find(data => data.date === date);  // 取得目標日期的美國公債殖利率

    return data;
  }
}
