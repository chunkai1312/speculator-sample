import * as _ from 'lodash';
import * as cheerio from 'cheerio';
import * as iconv from 'iconv-lite';
import * as numeral from 'numeral';
import { DateTime } from 'luxon';
import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { getTwseIndexSymbolByName } from '@speculator/common';

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

  async fetchIndicesQuotes(date: string) {
    // 將 `date` 轉換成 `yyyyMMdd` 格式
    const formattedDate = DateTime.fromISO(date).toFormat('yyyyMMdd');

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      response: 'json',     // 指定回應格式為 JSON
      date: formattedDate,  // 指定資料日期
    });
    const url = `https://www.twse.com.tw/exchangeReport/MI_5MINS_INDEX?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.stat === 'OK') ? response.data : null);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理每 5 秒指數統計數據
    const quotes = responseData.data.reduce((quotes, row) => {
      const [
        time,   // 時間
        IX0001, // 發行量加權股價指數
        IX0007, // 未含金融保險股指數
        IX0008, // 未含電子股指數
        IX0009, // 未含金融電子股指數
        IX0010, // 水泥類指數
        IX0011, // 食品類指數
        IX0012, // 塑膠類指數
        IX0016, // 紡織纖維類指數
        IX0017, // 電機機械類指數
        IX0018, // 電器電纜類指數
        IX0019, // 化學生技醫療類指數
        IX0020, // 化學類指數
        IX0021, // 生技醫療類指數
        IX0022, // 玻璃陶瓷類指數
        IX0023, // 造紙類指數
        IX0024, // 鋼鐵類指數
        IX0025, // 橡膠類指數
        IX0026, // 汽車類指數
        IX0027, // 電子類指數
        IX0028, // 半導體類指數
        IX0029, // 電腦及週邊設備類指數
        IX0030, // 光電類指數
        IX0031, // 通信網路類指數
        IX0032, // 電子零組件類指數
        IX0033, // 電子通路類指數
        IX0034, // 資訊服務類指數
        IX0035, // 其他電子類指數
        IX0036, // 建材營造類指數
        IX0037, // 航運類指數
        IX0038, // 觀光類指數
        IX0039, // 金融保險類指數
        IX0040, // 貿易百貨類指數
        IX0041, // 油電燃氣類指數
        IX0042, // 其他類指數
      ] = row;

      return [
        ...quotes,
        { date, time, symbol: 'IX0001', name: '發行量加權股價指數', price: numeral(IX0001).value()},
        { date, time, symbol: 'IX0007', name: '未含金融保險股指數', price: numeral(IX0007).value()},
        { date, time, symbol: 'IX0008', name: '未含電子股指數', price: numeral(IX0008).value()},
        { date, time, symbol: 'IX0009', name: '未含金融電子股指數', price: numeral(IX0009).value()},
        { date, time, symbol: 'IX0010', name: '水泥類指數', price: numeral(IX0010).value()},
        { date, time, symbol: 'IX0011', name: '食品類指數', price: numeral(IX0011).value()},
        { date, time, symbol: 'IX0012', name: '塑膠類指數', price: numeral(IX0012).value()},
        { date, time, symbol: 'IX0016', name: '紡織纖維類指數', price: numeral(IX0016).value()},
        { date, time, symbol: 'IX0017', name: '電機機械類指數', price: numeral(IX0017).value()},
        { date, time, symbol: 'IX0018', name: '電器電纜類指數', price: numeral(IX0018).value()},
        { date, time, symbol: 'IX0019', name: '化學生技醫療類指數', price: numeral(IX0019).value()},
        { date, time, symbol: 'IX0020', name: '化學類指數', price: numeral(IX0020).value()},
        { date, time, symbol: 'IX0021', name: '生技醫療類指數', price: numeral(IX0021).value()},
        { date, time, symbol: 'IX0022', name: '玻璃陶瓷類指數', price: numeral(IX0022).value()},
        { date, time, symbol: 'IX0023', name: '造紙類指數', price: numeral(IX0023).value()},
        { date, time, symbol: 'IX0024', name: '鋼鐵類指數', price: numeral(IX0024).value()},
        { date, time, symbol: 'IX0025', name: '橡膠類指數', price: numeral(IX0025).value()},
        { date, time, symbol: 'IX0026', name: '汽車類指數', price: numeral(IX0026).value()},
        { date, time, symbol: 'IX0027', name: '電子工業類指數', price: numeral(IX0027).value()},
        { date, time, symbol: 'IX0028', name: '半導體類指數', price: numeral(IX0028).value()},
        { date, time, symbol: 'IX0029', name: '電腦及週邊設備類指數', price: numeral(IX0029).value()},
        { date, time, symbol: 'IX0030', name: '光電類指數', price: numeral(IX0030).value()},
        { date, time, symbol: 'IX0031', name: '通信網路類指數', price: numeral(IX0031).value()},
        { date, time, symbol: 'IX0032', name: '電子零組件類指數', price: numeral(IX0032).value()},
        { date, time, symbol: 'IX0033', name: '電子通路類指數', price: numeral(IX0033).value()},
        { date, time, symbol: 'IX0034', name: '資訊服務類指數', price: numeral(IX0034).value()},
        { date, time, symbol: 'IX0035', name: '其他電子類指數', price: numeral(IX0035).value()},
        { date, time, symbol: 'IX0036', name: '建材營造類指數', price: numeral(IX0036).value()},
        { date, time, symbol: 'IX0037', name: '航運類指數', price: numeral(IX0037).value()},
        { date, time, symbol: 'IX0038', name: '觀光類指數', price: numeral(IX0038).value()},
        { date, time, symbol: 'IX0039', name: '金融保險類指數', price: numeral(IX0039).value()},
        { date, time, symbol: 'IX0040', name: '貿易百貨類指數', price: numeral(IX0040).value()},
        { date, time, symbol: 'IX0041', name: '油電燃氣類指數', price: numeral(IX0041).value()},
        { date, time, symbol: 'IX0042', name: '其他類指數', price: numeral(IX0042).value()},
      ];
    }, []);

    // 計算開高低收以及漲跌幅
    const data = _(quotes)
      .groupBy('symbol')
      .map((data: any[]) => {
        const [ prev, ...quotes ] = data;
        const { date, symbol, name } = prev;
        const openPrice = _.minBy(quotes, 'time').price;
        const highPrice = _.maxBy(quotes, 'price').price;
        const lowPrice = _.minBy(quotes, 'price').price;
        const closePrice = _.maxBy(quotes, 'time').price;
        const referencePrice = prev.price;
        const change = numeral(closePrice).subtract(referencePrice).value();
        const changePercent = +numeral(change).divide(referencePrice).multiply(100).format('0.00');
        return {
          date,           // 日期
          symbol,         // 指數代號
          name,           // 指數名稱
          openPrice,      // 開盤價
          highPrice,      // 最高價
          lowPrice,       // 最低價
          closePrice,     // 收盤價
          change,         // 漲跌
          changePercent,  // 漲跌幅
        };
      })
      .value();

    return data;
  }

  async fetchIndicesTrades(date: string) {
    // // 將 `date` 轉換成 `yyyyMMdd` 格式
    const formattedDate = DateTime.fromISO(date).toFormat('yyyyMMdd');

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      response: 'json',     // 指定回應格式為 JSON
      date: formattedDate,  // 指定資料日期
    });
    const url = `https://www.twse.com.tw/exchangeReport/BFIAMU?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.stat === 'OK') ? response.data : null);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 取得市場成交量值
    const market = await this.fetchMarketTrades(date);

    // 計算成交比重
    const data = responseData.data.map(row => {
      const [
        name,         // 分類指數名稱
        tradeVolume,  // 成交股數
        tradeValue,   // 成交金額
        transaction,  // 成交筆數
        change,       // 漲跌指數
      ] = row;
      return {
        date,
        symbol: getTwseIndexSymbolByName(name.trim()),
        tradeVolume: numeral(tradeVolume).value(),
        tradeValue: numeral(tradeValue).value(),
        tradeWeight: +numeral(tradeValue).divide(market.tradeValue).multiply(100).format('0.00'),
      };
    });

    return data;
  }

  async fetchEquitiesQuotes(date: string) {
    // 將 `date` 轉換成 `yyyyMMdd` 格式
    const formattedDate = DateTime.fromISO(date).toFormat('yyyyMMdd');

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      response: 'json',     // 指定回應格式為 JSON
      date: formattedDate,  // 指定資料日期
      type: 'ALLBUT0999',   // 指定分類項目為全部(不含權證、牛熊證、可展延牛熊證)
    });
    const url = `https://www.twse.com.tw/exchangeReport/MI_INDEX?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.stat === 'OK') ? response.data : null);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const data = responseData.data9.map(row => {
      const [ symbol, name, ...values ] = row;
      const [
        tradeVolume,  // 成交股數
        transaction,  // 成交筆數
        tradeValue,   // 成交金額
        openPrice,    // 開盤價
        highPrice,    // 最高價
        lowPrice,     // 最低價
        closePrice,   // 收盤價
      ] = values.slice(0, 7).map(value => numeral(value).value());

      // 計算漲跌
      const change = values[7].includes('green')
        ? numeral(values[8]).multiply(-1).value()
        : numeral(values[8]).value();

      // 回推參考價
      const referencePrice = closePrice && numeral(closePrice).subtract(change).value();

      // 計算漲跌幅
      const changePercent = closePrice  && +numeral(change).divide(referencePrice).multiply(100).format('0.00');

      return {
        date,
        symbol,
        name,
        openPrice,
        highPrice,
        lowPrice,
        closePrice,
        change,
        changePercent,
        tradeVolume,
        tradeValue,
        transaction,
      };
    });

    return data;
  }

  async fetchEquitiesInstInvestorsTrades(date: string) {
    // 將 `date` 轉換成 `yyyyMMdd` 格式
    const formattedDate = DateTime.fromISO(date).toFormat('yyyyMMdd');

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      response: 'json',     // 指定回應格式為 JSON
      date: formattedDate,  // 指定資料日期
      selectType: 'ALLBUT0999',   // 指定分類項目為全部(不含權證、牛熊證、可展延牛熊證)
    });
    const url = `https://www.twse.com.tw/fund/T86?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then((response) => (response.data.stat === 'OK' ? response.data : null));

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const data = responseData.data.reduce((tickers, row) => {
      const [ symbol, name, ...values ] = row;
      const [
        foreignDealersExcludedBuy,        // 外陸資買進股數(不含外資自營商)
        foreignDealersExcludedSell,       // 外陸資賣出股數(不含外資自營商)
        foreignDealersExcludedNetBuySell, // 外陸資買賣超股數(不含外資自營商)
        foreignDealersBuy,                // 外資自營商買進股數
        foreignDealersSell,               // 外資自營商賣出股數
        foreignDealersNetBuySell,         // 外資自營商買賣超股數
        sitcBuy,                          // 投信買進股數
        sitcSell,                         // 投信賣出股數
        sitcNetBuySell,                   // 投信買賣超股數
        dealersNetBuySell,                // 自營商買賣超股數
        dealersProprietaryBuy,            // 自營商買進股數(自行買賣)
        dealersProprietarySell,           // 自營商賣出股數(自行買賣)
        dealersProprietaryNetBuySell,     // 自營商買賣超股數(自行買賣)
        dealersHedgeBuy,                  // 自營商買進股數(避險)
        dealersHedgeSell,                 // 自營商賣出股數(避險)
        dealersHedgeNetBuySell,           // 自營商買賣超股數(避險)
        instInvestorsNetBuySell,          // 三大法人買賣超股數
      ] = values.map(value => numeral(value).value());

      // 計算外資合計買進股數
      const foreignInvestorsBuy = foreignDealersExcludedBuy + foreignDealersBuy;

      // 外資合計賣出股數
      const foreignInvestorsSell = foreignDealersExcludedSell + foreignDealersSell;

      // 計算外資合計買賣超股數
      const foreignInvestorsNetBuySell = foreignDealersExcludedNetBuySell + foreignDealersNetBuySell;

      // 計算自營商合計買進股數
      const dealersBuy = dealersProprietaryBuy + dealersHedgeBuy;

      // 計算自營商合計賣出股數
      const dealersSell = dealersProprietarySell + dealersHedgeSell;

      const ticker = {
        date,
        symbol,
        name: name.trim(),
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
      return [ ...tickers, ticker ];
    }, []);

    return data;
  }
}
