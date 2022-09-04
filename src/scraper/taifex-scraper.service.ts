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

  async fetchInstInvestorsTxoTrades(date: string) {
    // 將 `date` 轉換成 `yyyy/MM/dd` 格式
    const queryDate = DateTime.fromISO(date).toFormat('yyyy/MM/dd');

    // 建立 FormData
    const form = new URLSearchParams({
      queryStartDate: queryDate,  // 日期(起)
      queryEndDate: queryDate,    // 日期(迄)
      commodityId: 'TXO',         // 契約-臺指選擇權
    });
    const url = 'https://www.taifex.com.tw/cht/3/callsAndPutsDateDown';

    // 取得回應資料並將 CSV 轉換成 JSON 格式及正確編碼
    const responseData = await firstValueFrom(this.httpService.post(url, form, { responseType: 'arraybuffer' }))
      .then(response => csvtojson({ noheader: true, output: 'csv' }).fromString(iconv.decode(response.data, 'big5')));

    // 若該日期非交易日或尚無資料則回傳 null
    const [ fields, dealersCalls, sitcCalls, finiCalls, dealersPuts, sitcPuts, finiPuts ] = responseData;
    if (fields[0] !== '日期') return null;

    // 合併三大法人交易數據並將 string 型別數字轉換成 number
    const raw = [
      ...dealersCalls.slice(4),
      ...sitcCalls.slice(4),
      ...finiCalls.slice(4),
      ...dealersPuts.slice(4),
      ...sitcPuts.slice(4),
      ...finiPuts.slice(4),
    ].map(data => numeral(data).value());

    const [
      dealersCallsLongTradeVolume,  // 自營商-買權買方交易口數
      dealersCallsLongTradeValue,   // 自營商-買權買方交易契約金額(千元)
      dealersCallsShortTradeVolume, // 自營商-買權賣方交易口數
      dealersCallsShortTradeValue,  // 自營商-買權賣方交易契約金額(千元)
      dealersCallsNetTradeVolume,   // 自營商-買權交易口數買賣淨額
      dealersCallsNetTradeValue,    // 自營商-買權交易契約金額買賣淨額(千元)
      dealersCallsLongOiVolume,     // 自營商-買權買方未平倉口數,
      dealersCallsLongOiValue,      // 自營商-買權買方未平倉契約金額(千元)
      dealersCallsShortOiVolume,    // 自營商-買權賣方未平倉口數
      dealersCallsShortOiValue,     // 自營商-買權賣方未平倉契約金額(千元)
      dealersCallsNetOiVolume,      // 自營商-買權未平倉口數買賣淨額
      dealersCallsNetOiValue,       // 自營商-買權未平倉契約金額買賣淨額(千元)
      sitcCallsLongTradeVolume,     // 投信-買權買方交易口數
      sitcCallsLongTradeValue,      // 投信-買權買方交易契約金額(千元)
      sitcCallsShortTradeVolume,    // 投信-買權賣方交易口數
      sitcCallsShortTradeValue,     // 投信-買權賣方交易契約金額(千元)
      sitcCallsNetTradeVolume,      // 投信-買權交易口數買賣淨額
      sitcCallsNetTradeValue,       // 投信-買權交易契約金額買賣淨額(千元)
      sitcCallsLongOiVolume,        // 投信-買權買方未平倉口數,
      sitcCallsLongOiValue,         // 投信-買權買方未平倉契約金額(千元)
      sitcCallsShortOiVolume,       // 投信-買權賣方未平倉口數
      sitcCallsShortOiValue,        // 投信-買權賣方未平倉契約金額(千元)
      sitcCallsNetOiVolume,         // 投信-買權未平倉口數買賣淨額
      sitcCallsNetOiValue,          // 投信-買權未平倉契約金額買賣淨額(千元)
      finiCallsLongTradeVolume,     // 外資-買權買方交易口數
      finiCallsLongTradeValue,      // 外資-買權買方交易契約金額(千元)
      finiCallsShortTradeVolume,    // 外資-買權賣方交易口數
      finiCallsShortTradeValue,     // 外資-買權賣方交易契約金額(千元)
      finiCallsNetTradeVolume,      // 外資-買權交易口數買賣淨額
      finiCallsNetTradeValue,       // 外資-買權交易契約金額買賣淨額(千元)
      finiCallsLongOiVolume,        // 外資-買權買方未平倉口數,
      finiCallsLongOiValue,         // 外資-買權買方未平倉契約金額(千元)
      finiCallsShortOiVolume,       // 外資-買權賣方未平倉口數
      finiCallsShortOiValue,        // 外資-買權賣方未平倉契約金額(千元)
      finiCallsNetOiVolume,         // 外資-買權未平倉口數買賣淨額
      finiCallsNetOiValue,          // 外資-買權未平倉契約金額買賣淨額(千元)
      dealersPutsLongTradeVolume,   // 自營商-賣權買方交易口數
      dealersPutsLongTradeValue,    // 自營商-賣權買方交易契約金額(千元)
      dealersPutsShortTradeVolume,  // 自營商-賣權賣方交易口數
      dealersPutsShortTradeValue,   // 自營商-賣權賣方交易契約金額(千元)
      dealersPutsNetTradeVolume,    // 自營商-賣權交易口數買賣淨額
      dealersPutsNetTradeValue,     // 自營商-賣權交易契約金額買賣淨額(千元)
      dealersPutsLongOiVolume,      // 自營商-賣權買方未平倉口數,
      dealersPutsLongOiValue,       // 自營商-賣權買方未平倉契約金額(千元)
      dealersPutsShortOiVolume,     // 自營商-賣權賣方未平倉口數
      dealersPutsShortOiValue,      // 自營商-賣權賣方未平倉契約金額(千元)
      dealersPutsNetOiVolume,       // 自營商-賣權未平倉口數買賣淨額
      dealersPutsNetOiValue,        // 自營商-賣權未平倉契約金額買賣淨額(千元)
      sitcPutsLongTradeVolume,      // 投信-賣權買方交易口數
      sitcPutsLongTradeValue,       // 投信-賣權買方交易契約金額(千元)
      sitcPutsShortTradeVolume,     // 投信-賣權賣方交易口數
      sitcPutsShortTradeValue,      // 投信-賣權賣方交易契約金額(千元)
      sitcPutsNetTradeVolume,       // 投信-賣權交易口數買賣淨額
      sitcPutsNetTradeValue,        // 投信-賣權交易契約金額買賣淨額(千元)
      sitcPutsLongOiVolume,         // 投信-賣權買方未平倉口數,
      sitcPutsLongOiValue,          // 投信-賣權買方未平倉契約金額(千元)
      sitcPutsShortOiVolume,        // 投信-賣權賣方未平倉口數
      sitcPutsShortOiValue,         // 投信-賣權賣方未平倉契約金額(千元)
      sitcPutsNetOiVolume,          // 投信-賣權未平倉口數買賣淨額
      sitcPutsNetOiValue,           // 投信-賣權未平倉契約金額買賣淨額(千元)
      finiPutsLongTradeVolume,      // 外資-賣權買方交易口數
      finiPutsLongTradeValue,       // 外資-賣權買方交易契約金額(千元)
      finiPutsShortTradeVolume,     // 外資-賣權賣方交易口數
      finiPutsShortTradeValue,      // 外資-賣權賣方交易契約金額(千元)
      finiPutsNetTradeVolume,       // 外資-賣權交易口數買賣淨額
      finiPutsNetTradeValue,        // 外資-賣權交易契約金額買賣淨額(千元)
      finiPutsLongOiVolume,         // 外資-賣權買方未平倉口數,
      finiPutsLongOiValue,          // 外資-賣權買方未平倉契約金額(千元)
      finiPutsShortOiVolume,        // 外資-賣權賣方未平倉口數
      finiPutsShortOiValue,         // 外資-賣權賣方未平倉契約金額(千元)
      finiPutsNetOiVolume,          // 外資-賣權未平倉口數買賣淨額
      finiPutsNetOiValue,           // 外資-賣權未平倉契約金額買賣淨額(千元)
    ] = raw;

    return {
      date,
      finiCallsLongTradeVolume,
      finiCallsLongTradeValue,
      finiCallsShortTradeVolume,
      finiCallsShortTradeValue,
      finiCallsNetTradeVolume,
      finiCallsNetTradeValue,
      finiCallsLongOiVolume,
      finiCallsLongOiValue,
      finiCallsShortOiVolume,
      finiCallsShortOiValue,
      finiCallsNetOiVolume,
      finiCallsNetOiValue,
      finiPutsLongTradeVolume,
      finiPutsLongTradeValue,
      finiPutsShortTradeVolume,
      finiPutsShortTradeValue,
      finiPutsNetTradeVolume,
      finiPutsNetTradeValue,
      finiPutsLongOiVolume,
      finiPutsLongOiValue,
      finiPutsShortOiVolume,
      finiPutsShortOiValue,
      finiPutsNetOiVolume,
      finiPutsNetOiValue,
      sitcCallsLongTradeVolume,
      sitcCallsLongTradeValue,
      sitcCallsShortTradeVolume,
      sitcCallsShortTradeValue,
      sitcCallsNetTradeVolume,
      sitcCallsNetTradeValue,
      sitcCallsLongOiVolume,
      sitcCallsLongOiValue,
      sitcCallsShortOiVolume,
      sitcCallsShortOiValue,
      sitcCallsNetOiVolume,
      sitcCallsNetOiValue,
      sitcPutsLongTradeVolume,
      sitcPutsLongTradeValue,
      sitcPutsShortTradeVolume,
      sitcPutsShortTradeValue,
      sitcPutsNetTradeVolume,
      sitcPutsNetTradeValue,
      sitcPutsLongOiVolume,
      sitcPutsLongOiValue,
      sitcPutsShortOiVolume,
      sitcPutsShortOiValue,
      sitcPutsNetOiVolume,
      sitcPutsNetOiValue,
      dealersCallsLongTradeVolume,
      dealersCallsLongTradeValue,
      dealersCallsShortTradeVolume,
      dealersCallsShortTradeValue,
      dealersCallsNetTradeVolume,
      dealersCallsNetTradeValue,
      dealersCallsLongOiVolume,
      dealersCallsLongOiValue,
      dealersCallsShortOiVolume,
      dealersCallsShortOiValue,
      dealersCallsNetOiVolume,
      dealersCallsNetOiValue,
      dealersPutsLongTradeVolume,
      dealersPutsLongTradeValue,
      dealersPutsShortTradeVolume,
      dealersPutsShortTradeValue,
      dealersPutsNetTradeVolume,
      dealersPutsNetTradeValue,
      dealersPutsLongOiVolume,
      dealersPutsLongOiValue,
      dealersPutsShortOiVolume,
      dealersPutsShortOiValue,
      dealersPutsNetOiVolume,
      dealersPutsNetOiValue,
    };
  }
}
