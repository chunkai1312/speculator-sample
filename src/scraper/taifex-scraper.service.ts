import * as csvtojson from 'csvtojson';
import * as iconv from 'iconv-lite';
import * as numeral from 'numeral';
import { DateTime } from 'luxon';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TaifexScraperService {
  constructor(private httpService: HttpService) { }

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
    const [fields, dealers, sitc, fini] = responseData;
    if (fields[0] !== '日期') return null;

    // 合併三大法人交易數據並將 string 型別數字轉換成 number
    const raw = [...dealers.slice(3), ...sitc.slice(3), ...fini.slice(3)]
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
    const [fields, dealersCalls, sitcCalls, finiCalls, dealersPuts, sitcPuts, finiPuts] = responseData;
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

  async fetchTxoPutCallRatio(date: string) {
    // 將 `date` 轉換成 `yyyy/MM/dd` 格式
    const queryDate = DateTime.fromISO(date).toFormat('yyyy/MM/dd');

    // 建立 FormData
    const form = new URLSearchParams({
      queryStartDate: queryDate,  // 日期(起)
      queryEndDate: queryDate,    // 日期(迄)
    });
    const url = 'https://www.taifex.com.tw/cht/3/pcRatioDown';

    // 取得回應資料並將 CSV 轉換成 JSON 格式及正確編碼
    const responseData = await firstValueFrom(this.httpService.post(url, form, { responseType: 'arraybuffer' }))
      .then(response => csvtojson({ noheader: true, output: 'csv' }).fromString(iconv.decode(response.data, 'big5')));

    // 若該日期非交易日或尚無資料則回傳 null
    const [fields, row] = responseData;
    if (!row) return null;

    // 將 string 型別數字轉換成 number
    const raw = row.slice(1).map(data => numeral(data).value());

    const [
      txoPutVolume,                   // 賣權成交量
      txoCallVolume,                  // 買權成交量
      txoPutCallVolumeRatioPercent,   // 買賣權成交量比率%
      txoPutOi,                       // 賣權未平倉量
      txoCallOi,                      // 買權未平倉量
      txoPutCallRatioPercent,         // 買賣權未平倉量比率%
    ] = raw;

    // 轉換為比率
    const txoPutCallVolumeRatio = numeral(txoPutCallVolumeRatioPercent).divide(100).value();
    const txoPutCallRatio = numeral(txoPutCallRatioPercent).divide(100).value();

    return {
      date,
      txoPutVolume,
      txoCallVolume,
      txoPutCallVolumeRatio,
      txoPutOi,
      txoCallOi,
      txoPutCallRatio,
    };
  }

  async fetchLargeTradersTxfPosition(date: string) {
    // 將 `date` 轉換成 `yyyy/MM/dd` 格式
    const queryDate = DateTime.fromISO(date).toFormat('yyyy/MM/dd');

    // 建立 FormData
    const form = new URLSearchParams({
      queryStartDate: queryDate,  // 日期(起)
      queryEndDate: queryDate,    // 日期(迄)
    });
    const url = 'https://www.taifex.com.tw/cht/3/largeTraderFutDown';

    // 取得回應資料並將 CSV 轉換成 JSON 格式及正確編碼
    const responseData = await firstValueFrom(this.httpService.post(url, form, { responseType: 'arraybuffer' }))
      .then(response => csvtojson({ noheader: true, output: 'csv' }).fromString(iconv.decode(response.data, 'big5')));

    // 若該日期非交易日或尚無資料則回傳 null
    const [fields, ...rows] = responseData;
    if (fields[0] !== '日期') return null;

    const txRows = rows.filter(row => row[1] === 'TX'); // 只取臺股期貨數據
    const [
      weekRow,                 // 臺股期貨週契約-大額交易人
      weekSpecificRow,         // 臺股期貨週契約-特定法人
      frontMonthRow,           // 臺股期貨近月契約-大額交易人
      frontMonthSpecificRow,   // 臺股期貨近月契約-特定法人
      allMonthsRow,            // 臺股期貨所有契約-大額交易人
      allMonthsSpecificRow,    // 臺股期貨所有契約-特定法人
    ] = txRows;

    // 將 string 型別數字轉換成 number 並計算出非特定人及遠月契約
    const frontMonth = frontMonthRow.slice(5, -1).map(data => numeral(data).value());
    const frontMonthSpecific = frontMonthSpecificRow.slice(5, -1).map(data => numeral(data).value());
    const frontMonthNonSpecific = frontMonth.map((data, i) => data - frontMonthSpecific[i]);
    const allMonths = allMonthsRow.slice(5, -1).map(data => numeral(data).value());
    const allMonthsSpecific = allMonthsSpecificRow.slice(5, -1).map(data => numeral(data).value());
    const allMonthsNonSpecific = allMonths.map((data, i) => data - allMonthsSpecific[i]);
    const backMonths = allMonths.map((data, i) => data - frontMonth[i]);
    const backMonthsSpecific = allMonthsSpecific.map((data, i) => data - frontMonthSpecific[i]);
    const backMonthsNonSpecific = backMonths.map((data, i) => data - backMonthsSpecific[i]);
    const frontMonthMarketOi = numeral(frontMonthRow.slice(-1)).value();
    const allMonthsMarketOi = numeral(allMonthsRow.slice(-1)).value();
    const backMonthsMarketOi = allMonthsMarketOi - frontMonthMarketOi;

    // 合併所有數據
    const raw = [
      ...frontMonth,
      ...frontMonthSpecific,
      ...frontMonthNonSpecific,
      ...allMonths,
      ...allMonthsSpecific,
      ...allMonthsNonSpecific,
      ...backMonths,
      ...backMonthsSpecific,
      ...backMonthsNonSpecific,
    ];

    const [
      top5FrontMonthLongOi,               // 前五大交易人-近月契約買方
      top5FrontMonthShortOi,              // 前五大交易人-近月契約賣方
      top10FrontMonthLongOi,              // 前十大交易人-近月契約買方
      top10FrontMonthShortOi,             // 前十大交易人-近月契約賣方
      top5SpecificFrontMonthLongOi,       // 前五大特定法人-近月契約買方
      top5SpecificFrontMonthShortOi,      // 前五大特定法人-近月契約賣方
      top10SpecificFrontMonthLongOi,      // 前十大特定法人-近月契約買方
      top10SpecificFrontMonthShortOi,     // 前十大特定法人-近月契約賣方
      top5NonSpecificFrontMonthLongOi,    // 前五大非特定法人-近月契約買方
      top5NonSpecificFrontMonthShortOi,   // 前五大非特定法人-近月契約賣方
      top10NonSpecificFrontMonthLongOi,   // 前十大非特定法人-近月契約買方
      top10NonSpecificFrontMonthShortOi,  // 前十大非特定法人-近月契約賣方
      top5AllMonthsLongOi,                // 前五大交易人-全部契約買方
      top5AllMonthsShortOi,               // 前五大交易人-全部契約賣方
      top10AllMonthsLongOi,               // 前十大交易人-全部契約買方
      top10AllMonthsShortOi,              // 前十大交易人-全部契約賣方
      top5SpecificAllMonthsLongOi,        // 前五大特定法人-全部契約買方
      top5specificAllMonthsShortOi,       // 前五大特定法人-全部契約賣方
      top10SpecificAllMonthsLongOi,       // 前十大特定法人-全部契約買方
      top10SpecificAllMonthsShortOi,      // 前十大特定法人-全部契約賣方
      top5NonSpecificAllMonthsLongOi,     // 全部契約 前五大非特定法人買方
      top5NonSpecificAllMonthsShortOi,    // 全部契約 前五大非特定法人賣方
      top10NonSpecificAllMonthsLongOi,    // 全部契約 前十大非特定法人買方
      top10NonSpecificAllMonthsShortOi,   // 全部契約 前十大非特定法人賣方
      top5BackMonthsLongOi,               // 前五大交易人-遠月契約買方
      top5BackMonthsShortOi,              // 前五大交易人-遠月契約賣方
      top10BackMonthsLongOi,              // 前十大交易人-遠月契約買方
      top10BackMonthsShortOi,             // 前十大交易人-遠月契約賣方
      top5SpecificBackMonthsLongOi,       // 前五大特定法人-遠月契約買方
      top5SpecificBackMonthsShortOi,      // 前五大特定法人-遠月契約賣方
      top10SpecificBackMonthsLongOi,      // 前十大特定法人-遠月契約買方
      top10SpecificBackMonthsShortOi,     // 前十大特定法人-遠月契約賣方
      top5NonSpecificBackMonthsLongOi,    // 前五大特定法人-遠月契約買方
      top5NonSpecificBackMonthsShortOi,   // 前五大特定法人-遠月契約賣方
      top10NonSpecificBackMonthsLongOi,   // 前十大特定法人-遠月契約買方
      top10NonSpecificBackMonthsShortOi,  // 前十大特定法人-遠月契約賣方
    ] = raw;

    // 計算近月契約大額交易人淨部位
    const top5FrontMonthNetOi = top5FrontMonthLongOi - top5FrontMonthShortOi;
    const top10FrontMonthNetOi = top10FrontMonthLongOi - top10FrontMonthShortOi;
    const top5SpecificFrontMonthNetOi = top5SpecificFrontMonthLongOi - top5SpecificFrontMonthShortOi;
    const top10SpecificFrontMonthNetOi = top10SpecificFrontMonthLongOi - top10SpecificFrontMonthShortOi;
    const top5NonSpecificFrontMonthNetOi = top5NonSpecificFrontMonthLongOi - top5NonSpecificFrontMonthShortOi;
    const top10NonSpecificFrontMonthNetOi = top10NonSpecificFrontMonthLongOi - top10NonSpecificFrontMonthShortOi;

    // 計算全部契約大額交易人淨部位
    const top5AllMonthsNetOi = top5AllMonthsLongOi - top5AllMonthsShortOi;
    const top10AllMonthsNetOi = top10AllMonthsLongOi - top10AllMonthsShortOi;
    const top5SpecificAllMonthsNetOi = top5SpecificAllMonthsLongOi - top5specificAllMonthsShortOi;
    const top10SpecificAllMonthsNetOi = top10SpecificAllMonthsLongOi - top10SpecificAllMonthsShortOi;
    const top5NonSpecificAllMonthsNetOi = top5NonSpecificAllMonthsLongOi - top5NonSpecificAllMonthsShortOi;
    const top10NonSpecificAllMonthsNetOi = top10NonSpecificAllMonthsLongOi - top10NonSpecificAllMonthsShortOi;

    // 計算遠月契約大額交易人淨部位
    const top5BackMonthsNetOi = top5BackMonthsLongOi - top5BackMonthsShortOi;
    const top10BackMonthsNetOi = top10BackMonthsLongOi - top10BackMonthsShortOi;
    const top5SpecificBackMonthsNetOi = top5SpecificBackMonthsLongOi - top5SpecificBackMonthsShortOi;
    const top10SpecificBackMonthsNetOi = top10SpecificBackMonthsLongOi - top10SpecificBackMonthsShortOi;
    const top5NonSpecificBackMonthsNetOi = top5NonSpecificBackMonthsLongOi - top5NonSpecificBackMonthsShortOi;
    const top10NonSpecificBackMonthsNetOi = top10NonSpecificBackMonthsLongOi - top10NonSpecificBackMonthsShortOi;

    return {
      date,
      top5SpecificFrontMonthLongOi,
      top5SpecificFrontMonthShortOi,
      top5SpecificFrontMonthNetOi,
      top5SpecificBackMonthsLongOi,
      top5SpecificBackMonthsShortOi,
      top5SpecificBackMonthsNetOi,
      top5NonSpecificFrontMonthLongOi,
      top5NonSpecificFrontMonthShortOi,
      top5NonSpecificFrontMonthNetOi,
      top5NonSpecificBackMonthsLongOi,
      top5NonSpecificBackMonthsShortOi,
      top5NonSpecificBackMonthsNetOi,
      top10SpecificFrontMonthLongOi,
      top10SpecificFrontMonthShortOi,
      top10SpecificFrontMonthNetOi,
      top10SpecificBackMonthsLongOi,
      top10SpecificBackMonthsShortOi,
      top10SpecificBackMonthsNetOi,
      top10NonSpecificFrontMonthLongOi,
      top10NonSpecificFrontMonthShortOi,
      top10NonSpecificFrontMonthNetOi,
      top10NonSpecificBackMonthsLongOi,
      top10NonSpecificBackMonthsShortOi,
      top10NonSpecificBackMonthsNetOi,
      frontMonthMarketOi,
      backMonthsMarketOi,
    };
  }

  async fetchLargeTradersTxoPosition(date: string) {
    // 將 `date` 轉換成 `yyyy/MM/dd` 格式
    const queryDate = DateTime.fromISO(date).toFormat('yyyy/MM/dd');

    // 建立 FormData
    const form = new URLSearchParams({
      queryStartDate: queryDate,  // 日期(起)
      queryEndDate: queryDate,    // 日期(迄)
    });
    const url = 'https://www.taifex.com.tw/cht/3/largeTraderOptDown';

    // 取得回應資料並將 CSV 轉換成 JSON 格式及正確編碼
    const responseData = await firstValueFrom(this.httpService.post(url, form, { responseType: 'arraybuffer' }))
      .then(response => csvtojson({ noheader: true, output: 'csv' }).fromString(iconv.decode(response.data, 'big5')));

    // 若該日期非交易日或尚無資料則回傳 null
    const [fields, ...rows] = responseData;
    if (fields[0] !== '日期') return null;

    const txoRows = rows.filter(row => row[1] === 'TXO'); // 只取臺指選擇權數據
    const [
      txoCallWeekRow,                // 臺指選擇權買權週契約-大額交易人
      txoCallWeekSpecificRow,        // 臺指選擇權買權週契約-特定法人
      txoCallFrontMonthRow,          // 臺指選擇權買權近月契約-大額交易人
      txoCallFrontMonthSpecificRow,  // 臺指選擇權買權近月契約-特定法人
      txoCallAllMonthsRow,           // 臺指選擇權買權所有契約-大額交易人
      txoCallAllMonthsSpecificRow,   // 臺指選擇權買權所有契約-特定法人
      txoPutWeekRow,                 // 臺指選擇權賣權週契約-大額交易人
      txoPutWeekSpecificRow,         // 臺指選擇權賣權週契約-特定法人
      txoPutFrontMonthRow,           // 臺指選擇權賣權近月契約-大額交易人
      txoPutFrontMonthSpecificRow,   // 臺指選擇權賣權近月契約-特定法人
      txoPutAllMonthsRow,            // 臺指選擇權賣權所有契約-大額交易人
      txoPutAllMonthsSpecificRow,    // 臺指選擇權賣權所有契約-特定法人
    ] = txoRows;

    // 將 string 型別數字轉換成 number 並計算出非特定人及遠月契約
    const txoCallFrontMonth = txoCallFrontMonthRow.slice(6, -1).map(data => numeral(data).value());
    const txoCallFrontMonthSpecific = txoCallFrontMonthSpecificRow.slice(6, -1).map(data => numeral(data).value());
    const txoCallFrontMonthNonSpecific = txoCallFrontMonth.map((data, i) => data - txoCallFrontMonthSpecific[i]);
    const txoCallAllMonths = txoCallAllMonthsRow.slice(6, -1).map(data => numeral(data).value());
    const txoCallAllMonthsSpecific = txoCallAllMonthsSpecificRow.slice(6, -1).map(data => numeral(data).value());
    const txoCallAllMonthsNonSpecific = txoCallAllMonths.map((data, i) => data - txoCallAllMonthsSpecific[i]);
    const txoCallBackMonths = txoCallAllMonths.map((data, i) => data - txoCallFrontMonth[i]);
    const txoCallBackMonthsSpecific = txoCallAllMonthsSpecific.map((data, i) => data - txoCallFrontMonthSpecific[i]);
    const txoCallBackMonthsNonSpecific = txoCallBackMonths.map((data, i) => data - txoCallBackMonthsSpecific[i]);
    const txoCallFrontMonthMarketOi = numeral(txoCallFrontMonthRow.slice(-1)).value();
    const txoCallAllMonthsMarketOi = numeral(txoCallAllMonthsRow.slice(-1)).value();
    const txoCallBackMonthsMarketOi = txoCallAllMonthsMarketOi - txoCallFrontMonthMarketOi;
    const txoPutFrontMonth = txoPutFrontMonthRow.slice(6, -1).map(data => numeral(data).value());
    const txoPutFrontMonthSpecific = txoPutFrontMonthSpecificRow.slice(6, -1).map(data => numeral(data).value());
    const txoPutFrontMonthNonSpecific = txoPutFrontMonth.map((data, i) => data - txoPutFrontMonthSpecific[i]);
    const txoPutAllMonths = txoPutAllMonthsRow.slice(6, -1).map(data => numeral(data).value());
    const txoPutAllMonthsSpecific = txoPutAllMonthsSpecificRow.slice(6, -1).map(data => numeral(data).value());
    const txoPutAllMonthsNonSpecific = txoPutAllMonths.map((data, i) => data - txoPutAllMonthsSpecific[i]);
    const txoPutBackMonths = txoPutAllMonths.map((data, i) => data - txoPutFrontMonth[i]);
    const txoPutBackMonthsSpecific = txoPutAllMonthsSpecific.map((data, i) => data - txoPutFrontMonthSpecific[i]);
    const txoPutBackMonthsNonSpecific = txoPutBackMonths.map((data, i) => data - txoPutBackMonthsSpecific[i]);
    const txoPutFrontMonthMarketOi = numeral(txoPutFrontMonthRow.slice(-1)).value();
    const txoPutAllMonthsMarketOi = numeral(txoPutAllMonthsRow.slice(-1)).value();
    const txoPutBackMonthsMarketOi = txoPutAllMonthsMarketOi - txoPutFrontMonthMarketOi;

    // 合併所有數據
    const raw = [
      ...txoCallFrontMonth,
      ...txoCallFrontMonthSpecific,
      ...txoCallFrontMonthNonSpecific,
      ...txoCallAllMonths,
      ...txoCallAllMonthsSpecific,
      ...txoCallAllMonthsNonSpecific,
      ...txoCallBackMonths,
      ...txoCallBackMonthsSpecific,
      ...txoCallBackMonthsNonSpecific,
      ...txoPutFrontMonth,
      ...txoPutFrontMonthSpecific,
      ...txoPutFrontMonthNonSpecific,
      ...txoPutAllMonths,
      ...txoPutAllMonthsSpecific,
      ...txoPutAllMonthsNonSpecific,
      ...txoPutBackMonths,
      ...txoPutBackMonthsSpecific,
      ...txoPutBackMonthsNonSpecific,
    ];

    const [
      top5TxoCallFrontMonthLongOi,              // 前五大交易人-臺指買權近月契約買方
      top5TxoCallFrontMonthShortOi,             // 前五大交易人-臺指買權近月契約賣方
      top10TxoCallFrontMonthLongOi,             // 前十大交易人-臺指買權近月契約買方
      top10TxoCallFrontMonthShortOi,            // 前十大交易人-臺指買權近月契約賣方
      top5SpecificTxoCallFrontMonthLongOi,      // 前五大特定法人-臺指買權近月契約買方
      top5SpecificTxoCallFrontMonthShortOi,     // 前五大特定法人-臺指買權近月契約賣方
      top10SpecificTxoCallFrontMonthLongOi,     // 前十大特定法人-臺指買權近月契約買方
      top10SpecificTxoCallFrontMonthShortOi,    // 前十大特定法人-臺指買權近月契約賣方
      top5NonSpecificTxoCallFrontMonthLongOi,   // 前五大非特定法人-臺指買權近月契約買方
      top5NonSpecificTxoCallFrontMonthShortOi,  // 前五大非特定法人-臺指買權近月契約賣方
      top10NonSpecificTxoCallFrontMonthLongOi,  // 前十大非特定法人-臺指買權近月契約買方
      top10NonSpecificTxoCallFrontMonthShortOi, // 前十大非特定法人-臺指買權近月契約賣方
      top5TxoCallAllMonthsLongOi,               // 前五大交易人-臺指買權全部契約買方
      top5TxoCallAllMonthsShortOi,              // 前五大交易人-臺指買權全部契約賣方
      top10TxoCallAllMonthsLongOi,              // 前十大交易人-臺指買權全部契約買方
      top10TxoCallAllMonthsShortOi,             // 前十大交易人-臺指買權全部契約賣方
      top5SpecificTxoCallAllMonthsLongOi,       // 前五大特定法人-臺指買權全部契約買方
      top5SpecificTxoCallAllMonthsShortOi,      // 前五大特定法人-臺指買權全部契約賣方
      top10SpecificTxoCallAllMonthsLongOi,      // 前十大特定法人-臺指買權全部契約買方
      top10SpecificTxoCallAllMonthsShortOi,     // 前十大特定法人-臺指買權全部契約賣方
      top5NonSpecificTxoCallAllMonthsLongOi,    // 前五大非特定法人-臺指買權全部契約買方
      top5NonSpecificTxoCallAllMonthsShortOi,   // 前五大非特定法人-臺指買權全部契約賣方
      top10NonSpecificTxoCallAllMonthsLongOi,   // 前十大非特定法人-臺指買權全部契約買方
      top10NonSpecificTxoCallAllMonthsShortOi,  // 前十大非特定法人-臺指買權全部契約賣方
      top5TxoCallBackMonthsLongOi,              // 前五大交易人-臺指買權全部契約買方
      top5TxoCallBackMonthsShortOi,             // 前五大交易人-臺指買權全部契約賣方
      top10TxoCallBackMonthsLongOi,             // 前十大交易人-臺指買權全部契約買方
      top10TxoCallBackMonthsShortOi,            // 前十大交易人-臺指買權全部契約賣方
      top5SpecificTxoCallBackMonthsLongOi,      // 前五大特定法人-臺指買權全部契約買方
      top5SpecificTxoCallBackMonthsShortOi,     // 前五大特定法人-臺指買權全部契約賣方
      top10SpecificTxoCallBackMonthsLongOi,     // 前十大特定法人-臺指買權全部契約買方
      top10SpecificTxoCallBackMonthsShortOi,    // 前十大特定法人-臺指買權全部契約賣方
      top5NonSpecificTxoCallBackMonthsLongOi,   // 前五大非特定法人-臺指買權全部契約買方
      top5NonSpecificTxoCallBackMonthsShortOi,  // 前五大非特定法人-臺指買權全部契約賣方
      top10NonSpecificTxoCallBackMonthsLongOi,  // 前十大非特定法人-臺指買權全部契約買方
      top10NonSpecificTxoCallBackMonthsShortOi, // 前十大非特定法人-臺指買權全部契約賣方
      top5TxoPutFrontMonthLongOi,               // 前五大交易人-臺指賣權近月契約買方
      top5TxoPutFrontMonthShortOi,              // 前五大交易人-臺指賣權近月契約賣方
      top10TxoPutFrontMonthLongOi,              // 前十大交易人-臺指賣權近月契約買方
      top10TxoPutFrontMonthShortOi,             // 前十大交易人-臺指賣權近月契約賣方
      top5SpecificTxoPutFrontMonthLongOi,       // 前五大特定法人-臺指賣權近月契約買方
      top5SpecificTxoPutFrontMonthShortOi,      // 前五大特定法人-臺指賣權近月契約賣方
      top10SpecificTxoPutFrontMonthLongOi,      // 前十大特定法人-臺指賣權近月契約買方
      top10SpecificTxoPutFrontMonthShortOi,     // 前十大特定法人-臺指賣權近月契約賣方
      top5NonSpecificTxoPutFrontMonthLongOi,    // 前五大非特定法人-臺指賣權近月契約買方
      top5NonSpecificTxoPutFrontMonthShortOi,   // 前五大非特定法人-臺指賣權近月契約賣方
      top10NonSpecificTxoPutFrontMonthLongOi,   // 前十大非特定法人-臺指賣權近月契約買方
      top10NonSpecificTxoPutFrontMonthShortOi,  // 前十大非特定法人-臺指賣權近月契約賣方
      top5TxoPutAllMonthsLongOi,                // 前五大交易人-臺指賣權全部契約買方
      top5TxoPutAllMonthsShortOi,               // 前五大交易人-臺指賣權全部契約賣方
      top10TxoPutAllMonthsLongOi,               // 前十大交易人-臺指賣權全部契約買方
      top10TxoPutAllMonthsShortOi,              // 前十大交易人-臺指賣權全部契約賣方
      top5SpecificTxoPutAllMonthsLongOi,        // 前五大特定法人-臺指賣權全部契約買方
      top5SpecificTxoPutAllMonthsShortOi,       // 前五大特定法人-臺指賣權全部契約賣方
      top10SpecificTxoPutAllMonthsLongOi,       // 前十大特定法人-臺指賣權全部契約買方
      top10SpecificTxoPutAllMonthsShortOi,      // 前十大特定法人-臺指賣權全部契約賣方
      top5NonSpecificTxoPutAllMonthsLongOi,     // 前五大非特定法人-臺指賣權全部契約買方
      top5NonSpecificTxoPutAllMonthsShortOi,    // 前五大非特定法人-臺指賣權全部契約賣方
      top10NonSpecificTxoPutAllMonthsLongOi,    // 前十大非特定法人-臺指賣權全部契約買方
      top10NonSpecificTxoPutAllMonthsShortOi,   // 前十大非特定法人-臺指賣權全部契約賣方
      top5TxoPutBackMonthsLongOi,               // 前五大交易人-臺指買權遠月契約買方
      top5TxoPutBackMonthsShortOi,              // 前五大交易人-臺指買權遠月契約賣方
      top10TxoPutBackMonthsLongOi,              // 前十大交易人-臺指買權遠月契約買方
      top10TxoPutBackMonthsShortOi,             // 前十大交易人-臺指買權遠月契約賣方
      top5SpecificTxoPutBackMonthsLongOi,       // 前五大特定法人-臺指買權遠月契約買方
      top5SpecificTxoPutBackMonthsShortOi,      // 前五大特定法人-臺指買權遠月契約賣方
      top10SpecificTxoPutBackMonthsLongOi,      // 前十大特定法人-臺指買權遠月契約買方
      top10SpecificTxoPutBackMonthsShortOi,     // 前十大特定法人-臺指買權遠月契約賣方
      top5NonSpecificTxoPutBackMonthsLongOi,    // 前五大非特定法人-臺指買權遠月契約買方
      top5NonSpecificTxoPutBackMonthsShortOi,   // 前五大非特定法人-臺指買權遠月契約賣方
      top10NonSpecificTxoPutBackMonthsLongOi,   // 前十大非特定法人-臺指買權遠月契約買方
      top10NonSpecificTxoPutBackMonthsShortOi,  // 前十大非特定法人-臺指買權遠月契約賣方
    ] = raw;

    // 計算臺指買權近月契約大額交易人淨部位
    const top5TxoCallFrontMonthNetOi = top5TxoCallFrontMonthLongOi - top5TxoCallFrontMonthShortOi;
    const top10TxoCallFrontMonthNetOi = top10TxoCallFrontMonthLongOi - top10TxoCallFrontMonthShortOi;
    const top5SpecificTxoCallFrontMonthNetOi = top5SpecificTxoCallFrontMonthLongOi - top5SpecificTxoCallFrontMonthShortOi;
    const top10SpecificTxoCallFrontMonthNetOi = top10SpecificTxoCallFrontMonthLongOi - top10SpecificTxoCallFrontMonthShortOi;
    const top5NonSpecificTxoCallFrontMonthNetOi = top5NonSpecificTxoCallFrontMonthLongOi - top5NonSpecificTxoCallFrontMonthShortOi;
    const top10NonSpecificTxoCallFrontMonthNetOi = top10NonSpecificTxoCallFrontMonthLongOi - top10NonSpecificTxoCallFrontMonthShortOi;

    // 計算臺指買權全部契約大額交易人淨部位
    const top5TxoCallAllMonthsNetOi = top5TxoCallAllMonthsLongOi - top5TxoCallAllMonthsShortOi;
    const top10TxoCallAllMonthsNetOi = top10TxoCallAllMonthsLongOi - top10TxoCallAllMonthsShortOi;
    const top5SpecificTxoCallAllMonthsNetOi = top5SpecificTxoCallAllMonthsLongOi - top5SpecificTxoCallAllMonthsShortOi;
    const top10SpecificTxoCallAllMonthsNetOi = top10SpecificTxoCallAllMonthsLongOi - top10SpecificTxoCallAllMonthsShortOi;
    const top5NonSpecificTxoCallAllMonthsNetOi = top5NonSpecificTxoCallAllMonthsLongOi - top5NonSpecificTxoCallAllMonthsShortOi;
    const top10NonSpecificTxoCallAllMonthsNetOi = top10NonSpecificTxoCallAllMonthsLongOi - top10NonSpecificTxoCallAllMonthsShortOi;

    // 計算臺指買權遠月契約大額交易人淨部位
    const top5TxoCallBackMonthsNetOi = top5TxoCallBackMonthsLongOi - top5TxoCallBackMonthsShortOi;
    const top10TxoCallBackMonthsNetOi = top10TxoCallBackMonthsLongOi - top10TxoCallBackMonthsShortOi;
    const top5SpecificTxoCallBackMonthsNetOi = top5SpecificTxoCallBackMonthsLongOi - top5SpecificTxoCallBackMonthsShortOi;
    const top10SpecificTxoCallBackMonthsNetOi = top10SpecificTxoCallBackMonthsLongOi - top10SpecificTxoCallBackMonthsShortOi;
    const top5NonSpecificTxoCallBackMonthsNetOi = top5NonSpecificTxoCallBackMonthsLongOi - top5NonSpecificTxoCallBackMonthsShortOi;
    const top10NonSpecificTxoCallBackMonthsNetOi = top10NonSpecificTxoCallBackMonthsLongOi - top10NonSpecificTxoCallBackMonthsShortOi;

    // 計算臺指賣權近月契約大額交易人淨部位
    const top5TxoPutFrontMonthNetOi = top5TxoPutFrontMonthLongOi - top5TxoPutFrontMonthShortOi;
    const top10TxoPutFrontMonthNetOi = top10TxoPutFrontMonthLongOi - top10TxoPutFrontMonthShortOi;
    const top5SpecificTxoPutFrontMonthNetOi = top5SpecificTxoPutFrontMonthLongOi - top5SpecificTxoPutFrontMonthShortOi;
    const top10SpecificTxoPutFrontMonthNetOi = top10SpecificTxoPutFrontMonthLongOi - top10SpecificTxoPutFrontMonthShortOi;
    const top5NonSpecificTxoPutFrontMonthNetOi = top5NonSpecificTxoPutFrontMonthLongOi - top5NonSpecificTxoPutFrontMonthShortOi;
    const top10NonSpecificTxoPutFrontMonthNetOi = top10NonSpecificTxoPutFrontMonthLongOi - top10NonSpecificTxoPutFrontMonthShortOi;

    // 計算臺指賣權全部契約大額交易人淨部位
    const top5TxoPutAllMonthsNetOi = top5TxoPutAllMonthsLongOi - top5TxoPutAllMonthsShortOi;
    const top10TxoPutAllMonthsNetOi = top10TxoPutAllMonthsLongOi - top10TxoPutAllMonthsShortOi;
    const top5SpecificTxoPutAllMonthsNetOi = top5SpecificTxoPutAllMonthsLongOi - top5SpecificTxoPutAllMonthsShortOi;
    const top10SpecificTxoPutAllMonthsNetOi = top10SpecificTxoPutAllMonthsLongOi - top10SpecificTxoPutAllMonthsShortOi;
    const top5NonSpecificTxoPutAllMonthsNetOi = top5NonSpecificTxoPutAllMonthsLongOi - top5NonSpecificTxoPutAllMonthsShortOi;
    const top10NonSpecificTxoPutAllMonthsNetOi = top10NonSpecificTxoPutAllMonthsLongOi - top10NonSpecificTxoPutAllMonthsShortOi;

    // 計算臺指賣權遠月契約大額交易人淨部位
    const top5TxoPutBackMonthsNetOi = top5TxoPutBackMonthsLongOi - top5TxoPutBackMonthsShortOi;
    const top10TxoPutBackMonthsNetOi = top10TxoPutBackMonthsLongOi - top10TxoPutBackMonthsShortOi;
    const top5SpecificTxoPutBackMonthsNetOi = top5SpecificTxoPutBackMonthsLongOi - top5SpecificTxoPutBackMonthsShortOi;
    const top10SpecificTxoPutBackMonthsNetOi = top10SpecificTxoPutBackMonthsLongOi - top10SpecificTxoPutBackMonthsShortOi;
    const top5NonSpecificTxoPutBackMonthsNetOi = top5NonSpecificTxoPutBackMonthsLongOi - top5NonSpecificTxoPutBackMonthsShortOi;
    const top10NonSpecificTxoPutBackMonthsNetOi = top10NonSpecificTxoPutBackMonthsLongOi - top10NonSpecificTxoPutBackMonthsShortOi;

    return {
      date,
      top5SpecificTxoCallFrontMonthLongOi,
      top5SpecificTxoCallFrontMonthShortOi,
      top5SpecificTxoCallFrontMonthNetOi,
      top5SpecificTxoCallBackMonthsLongOi,
      top5SpecificTxoCallBackMonthsShortOi,
      top5SpecificTxoCallBackMonthsNetOi,
      top5NonSpecificTxoCallFrontMonthLongOi,
      top5NonSpecificTxoCallFrontMonthShortOi,
      top5NonSpecificTxoCallFrontMonthNetOi,
      top5NonSpecificTxoCallBackMonthsLongOi,
      top5NonSpecificTxoCallBackMonthsShortOi,
      top5NonSpecificTxoCallBackMonthsNetOi,
      top10SpecificTxoCallFrontMonthLongOi,
      top10SpecificTxoCallFrontMonthShortOi,
      top10SpecificTxoCallFrontMonthNetOi,
      top10SpecificTxoCallBackMonthsLongOi,
      top10SpecificTxoCallBackMonthsShortOi,
      top10SpecificTxoCallBackMonthsNetOi,
      top10NonSpecificTxoCallFrontMonthLongOi,
      top10NonSpecificTxoCallFrontMonthShortOi,
      top10NonSpecificTxoCallFrontMonthNetOi,
      top10NonSpecificTxoCallBackMonthsLongOi,
      top10NonSpecificTxoCallBackMonthsShortOi,
      top10NonSpecificTxoCallBackMonthsNetOi,
      top5SpecificTxoPutFrontMonthLongOi,
      top5SpecificTxoPutFrontMonthShortOi,
      top5SpecificTxoPutFrontMonthNetOi,
      top5SpecificTxoPutBackMonthsLongOi,
      top5SpecificTxoPutBackMonthsShortOi,
      top5SpecificTxoPutBackMonthsNetOi,
      top5NonSpecificTxoPutFrontMonthLongOi,
      top5NonSpecificTxoPutFrontMonthShortOi,
      top5NonSpecificTxoPutFrontMonthNetOi,
      top5NonSpecificTxoPutBackMonthsLongOi,
      top5NonSpecificTxoPutBackMonthsShortOi,
      top5NonSpecificTxoPutBackMonthsNetOi,
      top10SpecificTxoPutFrontMonthLongOi,
      top10SpecificTxoPutFrontMonthShortOi,
      top10SpecificTxoPutFrontMonthNetOi,
      top10SpecificTxoPutBackMonthsLongOi,
      top10SpecificTxoPutBackMonthsShortOi,
      top10SpecificTxoPutBackMonthsNetOi,
      top10NonSpecificTxoPutFrontMonthLongOi,
      top10NonSpecificTxoPutFrontMonthShortOi,
      top10NonSpecificTxoPutFrontMonthNetOi,
      top10NonSpecificTxoPutBackMonthsLongOi,
      top10NonSpecificTxoPutBackMonthsShortOi,
      top10NonSpecificTxoPutBackMonthsNetOi,
      txoCallFrontMonthMarketOi,
      txoCallBackMonthsMarketOi,
      txoPutFrontMonthMarketOi,
      txoPutBackMonthsMarketOi,
    };
  }
}
