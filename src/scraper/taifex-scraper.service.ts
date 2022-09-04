import * as csvtojson from 'csvtojson';
import * as iconv from 'iconv-lite';
import * as numeral from 'numeral';
import { DateTime } from 'luxon';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TaifexScraperService {
  constructor(private httpService: HttpService) {}

  async fetchInstInvestorsTxfTrades(date: string) {
    // 將 `date` 轉換成 `yyyy/MM/dd` 格式
    const queryDate = DateTime.fromISO(date).toFormat('yyyy/MM/dd');

    // 建立 FormData
    const form = new URLSearchParams({
      queryStartDate: queryDate,  // 日期(起)
      queryEndDate: queryDate,    // 日期(迄)
      commodityId: 'TXF',         // 契約-臺股期貨
    });
    const url = 'https://www.taifex.com.tw/cht/3/futContractsDateDown';

    // 取得回應資料並將 CSV 轉換成 JSON 格式及正確編碼
    const responseData = await firstValueFrom(this.httpService.post(url, form, { responseType: 'arraybuffer' }))
      .then(response => csvtojson({ noheader: true, output: 'csv' }).fromString(iconv.decode(response.data, 'big5')));

    // 若該日期非交易日或尚無資料則回傳 null
    const [ fields, dealers, sitc, fini ] = responseData;
    if (fields[0] !== '日期') return null;

    // 合併三大法人交易數據並將 string 型別數字轉換成 number
    const raw = [ ...dealers.slice(3), ...sitc.slice(3), ...fini.slice(3) ]
      .map(data => numeral(data).value());

    const [
      dealersLongTradeVolume,   // 自營商-多方交易口數
      dealersLongTradeValue,    // 自營商-多方交易契約金額(千元)
      dealersShortTradeVolume,  // 自營商-空方交易口數
      dealersShortTradeValue,   // 自營商-空方交易契約金額(千元)
      dealersNetTradeVolume,    // 自營商-多空交易口數淨額
      dealersNetTradeValue,     // 自營商-多空交易契約金額淨額(千元)
      dealersLongOiVolume,      // 自營商-多方未平倉口數
      dealersLongOiValue,       // 自營商-多方未平倉契約金額(千元)
      dealersShortOiVolume,     // 自營商-空方未平倉口數
      dealersShortOiValue,      // 自營商-空方未平倉契約金額(千元)
      dealersNetOiVolume,       // 自營商-多空未平倉口數淨額
      dealersNetOiValue,        // 自營商-多空未平倉契約金額淨額(千元)
      sitcLongTradeVolume,      // 投信-多方交易口數
      sitcLongTradeValue,       // 投信-多方交易契約金額(千元)
      sitcShortTradeVolume,     // 投信-空方交易口數
      sitcShortTradeValue,      // 投信-空方交易契約金額(千元)
      sitcNetTradeVolume,       // 投信-多空交易口數淨額
      sitcNetTradeValue,        // 投信-多空交易契約金額淨額(千元)
      sitcLongOiVolume,         // 投信-多方未平倉口數
      sitcLongOiValue,          // 投信-多方未平倉契約金額(千元)
      sitcShortOiVolume,        // 投信-空方未平倉口數
      sitcShortOiValue,         // 投信-空方未平倉契約金額(千元)
      sitcNetOiVolume,          // 投信-多空未平倉口數淨額
      sitcNetOiValue,           // 投信-多空未平倉契約金額淨額(千元)
      finiLongTradeVolume,      // 外資-多方交易口數
      finiLongTradeValue,       // 外資-多方交易契約金額(千元)
      finiShortTradeVolume,     // 外資-空方交易口數
      finiShortTradeValue,      // 外資-空方交易契約金額(千元)
      finiNetTradeVolume,       // 外資-多空交易口數淨額
      finiNetTradeValue,        // 外資-多空交易契約金額淨額(千元)
      finiLongOiVolume,         // 外資-多方未平倉口數
      finiLongOiValue,          // 外資-多方未平倉契約金額(千元)
      finiShortOiVolume,        // 外資-空方未平倉口數
      finiShortOiValue,         // 外資-空方未平倉契約金額(千元)
      finiNetOiVolume,          // 外資-多空未平倉口數淨額
      finiNetOiValue,           // 外資-多空未平倉契約金額淨額(千元)
    ] = raw;

    return {
      date,
      finiLongTradeVolume,
      finiLongTradeValue,
      finiShortTradeVolume,
      finiShortTradeValue,
      finiNetTradeVolume,
      finiNetTradeValue,
      finiLongOiVolume,
      finiLongOiValue,
      finiShortOiVolume,
      finiShortOiValue,
      finiNetOiVolume,
      finiNetOiValue,
      sitcLongTradeVolume,
      sitcLongTradeValue,
      sitcShortTradeVolume,
      sitcShortTradeValue,
      sitcNetTradeVolume,
      sitcNetTradeValue,
      sitcLongOiVolume,
      sitcLongOiValue,
      sitcShortOiVolume,
      sitcShortOiValue,
      sitcNetOiVolume,
      sitcNetOiValue,
      dealersLongTradeVolume,
      dealersLongTradeValue,
      dealersShortTradeVolume,
      dealersShortTradeValue,
      dealersNetTradeVolume,
      dealersNetTradeValue,
      dealersLongOiVolume,
      dealersLongOiValue,
      dealersShortOiVolume,
      dealersShortOiValue,
      dealersNetOiVolume,
      dealersNetOiValue,
    };
  }
}
