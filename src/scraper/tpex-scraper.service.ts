import * as _ from 'lodash';
import * as numeral from 'numeral';
import { DateTime } from 'luxon';
import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Index, getTpexIndexSymbolByName, isWarrant } from '@speculator/common';

@Injectable()
export class TpexScraperService {
  constructor(private httpService: HttpService) {}

  async fetchMarketTrades(date: string) {
    // 將 `date` 轉換成 `民國年/MM` 格式
    const dt = DateTime.fromISO(date);
    const year = dt.get('year') - 1911;
    const formattedDate = `${year}/${dt.toFormat('MM')}`;

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      l: 'zh-tw',         // 指定語系為正體中文
      d: formattedDate,   // 指定日期
      o: 'json',          // 指定回應格式為 JSON
    });
    const url = `https://www.tpex.org.tw/web/stock/aftertrading/daily_trading_index/st41_result.php?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.iTotalRecords > 0) && response.data);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const data = responseData.aaData.map(row => {
      // [ 日期, 成交股數, 金額, 筆數, 櫃買指數, 漲/跌 ]
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
    // `date` 轉換成 `民國年/MM/dd` 格式
    const dt = DateTime.fromISO(date);
    const year = dt.get('year') - 1911;
    const formattedDate = `${year}/${dt.toFormat('MM/dd')}`;

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      l: 'zh-tw',         // 指定語系為正體中文
      d: formattedDate,   // 指定日期
      o: 'json',          // 指定回應格式為 JSON
    });
    const url = `https://www.tpex.org.tw/web/stock/aftertrading/market_highlight/highlight_result.php?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.iTotalRecords > 0) && response.data);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const { upNum, upStopNum, downNum, downStopNum, noChangeNum, noTradeNum } = responseData;
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
    // `date` 轉換成 `民國年/MM/dd` 格式
    const dt = DateTime.fromISO(date);
    const year = dt.get('year') - 1911;
    const formattedDate = `${year}/${dt.toFormat('MM/dd')}`;

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      l: 'zh-tw',         // 指定語系為正體中文
      t: 'D',             // 指定輸出日報表
      d: formattedDate,   // 指定資料日期
      o: 'json',          // 指定回應格式為 JSON
    });
    const url = `https://www.tpex.org.tw/web/stock/3insti/3insti_summary/3itrdsum_result.php?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.iTotalRecords > 0) && response.data);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const raw = responseData.aaData
      .map(data => data.slice(1)).flat()  // 取買賣金額並減少一層陣列嵌套
      .map(data => numeral(data).value() || +data);   // 轉為數字格式

    const [
      foreignInvestorsBuy,                // 外資及陸資合計買進金額
      foreignInvestorsSell,               // 外資及陸資合計賣出金額
      foreignInvestorsNetBuySell,         // 外資及陸資合計買賣超
      foreignDealersExcludedBuy,          // 外資及陸資(不含外資自營商)買進金額
      foreignDealersExcludedSell,         // 外資及陸資(不含外資自營商)賣出金額
      foreignDealersExcludedNetBuySell,   // 外資及陸資(不含外資自營商)買賣超
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
    // `date` 轉換成 `民國年/MM/dd` 格式
    const dt = DateTime.fromISO(date);
    const year = dt.get('year') - 1911;
    const formattedDate = `${year}/${dt.toFormat('MM/dd')}`;

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      l: 'zh-tw',       // 指定語系為正體中文
      d: formattedDate, // 指定日期
      o: 'json',        // 指定回應格式為 JSON
    });
    const url = `https://www.tpex.org.tw/web/stock/margin_trading/margin_balance/margin_bal_result.php?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.iTotalRecords > 0) && response.data);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const raw = [
      ...responseData.tfootData_one,
      ...responseData.tfootData_two
    ]  // 取出融資融券統計
      .map(data => numeral(data).value()) // 轉為數字格式
      .filter(data => data);  // 移除 null 值

    const [
      marginBalancePrev,        // 融資(交易單位)-前日餘額
      marginPurchase,           // 融資(交易單位)-買進
      marginSale,               // 融資(交易單位)-賣出
      cashRedemption,           // 融資(交易單位)-現金(券)償還
      marginBalance,            // 融資(交易單位)-今日餘額
      shortBalancePrev,         // 融券(交易單位)-前日餘額
      shortCovering,            // 融券(交易單位)-買進
      shortSale,                // 融券(交易單位)-賣出
      stockRedemption,          // 融券(交易單位)-現金(券)償還
      shortBalance,             // 融券(交易單位)-今日餘額
      marginBalanceValuePrev,   // 融資金額(仟元)-前日餘額
      marginPurchaseValue,      // 融資金額(仟元)-買進
      marginSaleValue,          // 融資金額(仟元)-賣出
      cashRedemptionValue,      // 融資金額(仟元)-現金(券)償還
      marginBalanceValue,       // 融資金額(仟元)-今日餘額
    ] = raw;

    // 計算融資餘額增減(交易單位)
    const marginBalanceChange = marginBalance - marginBalancePrev;

    // 計算融資餘額增減(仟元)
    const marginBalanceValueChange = marginBalanceValue - marginBalanceValuePrev;

    // 計算融券餘額增減(交易單位)
    const shortBalanceChange = shortBalance - shortBalancePrev;

    return {
      date,
      marginBalance,
      marginBalanceChange,
      marginBalanceValue,
      marginBalanceValueChange,
      shortBalance,
      shortBalanceChange,
    };
  }

  async fetchIndicesQuotes(date: string) {
    // `date` 轉換成 `民國年/MM/dd` 格式
    const dt = DateTime.fromISO(date);
    const year = dt.get('year') - 1911;
    const formattedDate = `${year}/${dt.toFormat('MM/dd')}`;

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      l: 'zh-tw',       // 指定語系為正體中文
      d: formattedDate, // 指定資料日期
      o: 'json',        // 指定回應格式為 JSON
    });
    const url = `https://www.tpex.org.tw/web/stock/iNdex_info/minute_index/1MIN_result.php?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.iTotalRecords > 0) ? response.data : null);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理每 5 秒指數統計數據
    const quotes = responseData.aaData.reduce((quotes, row) => {
      const [
        time,   // 時間
        IX0044, // 櫃檯紡纖類指數
        IX0045, // 櫃檯機械類指數
        IX0046, // 櫃檯鋼鐵類指數
        IX0048, // 櫃檯營建類指數
        IX0049, // 櫃檯航運類指數
        IX0050, // 櫃檯觀光類指數
        IX0100, // 櫃檯其他類指數
        IX0051, // 櫃檯化工類指數
        IX0052, // 櫃檯生技醫療類指數
        IX0053, // 櫃檯半導體類指數
        IX0054, // 櫃檯電腦及週邊類指數
        IX0055, // 櫃檯光電業類指數
        IX0056, // 櫃檯通信網路類指數
        IX0057, // 櫃檯電子零組件類指數
        IX0058, // 櫃檯電子通路類指數
        IX0059, // 櫃檯資訊服務類指數
        IX0099, // 櫃檯其他電子類指數
        IX0075, // 櫃檯文化創意業類指數
        IX0047, // 櫃檯電子類指數
        IX0043, // 櫃檯指數
        tradeValue,   // 成交金額(萬元)
        tradeVolume,  // 成交張數
        transaction,  // 成交筆數
        bidOrders,    // 委買筆數
        askOrders,    // 委賣筆數
        bidVolume,    // 委買張數
        askVolume,    // 委賣張數
      ] = row;

      return [
        ...quotes,
        { date, time, symbol: 'IX0044', name: '櫃檯紡纖類指數', price: numeral(IX0044).value() },
        { date, time, symbol: 'IX0045', name: '櫃檯機械類指數', price: numeral(IX0045).value() },
        { date, time, symbol: 'IX0046', name: '櫃檯鋼鐵類指數', price: numeral(IX0046).value() },
        { date, time, symbol: 'IX0048', name: '櫃檯營建類指數', price: numeral(IX0048).value() },
        { date, time, symbol: 'IX0049', name: '櫃檯航運類指數', price: numeral(IX0049).value() },
        { date, time, symbol: 'IX0050', name: '櫃檯觀光類指數', price: numeral(IX0050).value() },
        { date, time, symbol: 'IX0100', name: '櫃檯其他類指數', price: numeral(IX0100).value() },
        { date, time, symbol: 'IX0051', name: '櫃檯化工類指數', price: numeral(IX0051).value() },
        { date, time, symbol: 'IX0052', name: '櫃檯生技醫療類指數', price: numeral(IX0052).value() },
        { date, time, symbol: 'IX0053', name: '櫃檯半導體類指數', price: numeral(IX0053).value() },
        { date, time, symbol: 'IX0054', name: '櫃檯電腦及週邊類指數', price: numeral(IX0054).value() },
        { date, time, symbol: 'IX0055', name: '櫃檯光電業類指數', price: numeral(IX0055).value() },
        { date, time, symbol: 'IX0056', name: '櫃檯通信網路類指數', price: numeral(IX0056).value() },
        { date, time, symbol: 'IX0057', name: '櫃檯電子零組件類指數', price: numeral(IX0057).value() },
        { date, time, symbol: 'IX0058', name: '櫃檯電子通路類指數', price: numeral(IX0058).value() },
        { date, time, symbol: 'IX0059', name: '櫃檯資訊服務類指數', price: numeral(IX0059).value() },
        { date, time, symbol: 'IX0099', name: '櫃檯其他電子類指數', price: numeral(IX0099).value() },
        { date, time, symbol: 'IX0075', name: '櫃檯文化創意業類指數', price: numeral(IX0075).value() },
        { date, time, symbol: 'IX0047', name: '櫃檯電子類指數', price: numeral(IX0047).value() },
        { date, time, symbol: 'IX0043', name: '櫃檯指數', price: numeral(IX0043).value() },
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
    // `date` 轉換成 `民國年/MM/dd` 格式
    const dt = DateTime.fromISO(date);
    const year = dt.get('year') - 1911;
    const formattedDate = `${year}/${dt.toFormat('MM/dd')}`;

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      l: 'zh-tw',       // 指定語系為正體中文
      d: formattedDate, // 指定資料日期
      o: 'json',        // 指定回應格式為 JSON
    });
    const url = `https://www.tpex.org.tw/web/stock/historical/trading_vol_ratio/sectr_result.php?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.iTotalRecords > 0) ? response.data : null);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const indices = responseData.aaData.map(row => {
      const [
        name,               // 類股名稱
        tradeValue,         // 成交金額(元)
        tradeValueWeight,   // 成交金額比重(%)
        tradeVolume,        // 成交股數
        tradeVolumeWeight,  // 成交股數比重(%)
      ] = row;
      return {
        date,
        symbol: getTpexIndexSymbolByName(name),
        tradeVolume: numeral(tradeVolume).value(),
        tradeValue: numeral(tradeValue).value(),
        tradeWeight: numeral(tradeValueWeight).value(),
      };
    });

    // 計算電子工業成交量值
    const electronic = indices.reduce((trades, data) => {
      return [
        Index.TPExSemiconductors,
        Index.TPExComputerAndPeripheralEquipment,
        Index.TPExOptoelectronic,
        Index.TPExCommunicationsAndInternet,
        Index.TPExElectronicPartsComponents,
        Index.TPExElectronicProductsDistribution,
        Index.TPExInformationService,
        Index.TPExOtherElectronic,
      ].includes(data.symbol)
        ? { ...trades,
          tradeVolume: trades.tradeVolume + data.tradeVolume,
          tradeValue: trades.tradeValue + data.tradeValue,
          tradeWeight: trades.tradeWeight + data.tradeWeight,
        } : trades;
    }, { date, symbol: Index.TPExElectronic, tradeVolume: 0, tradeValue: 0, tradeWeight: 0 });

    indices.push(electronic);

    // 過濾無對應指數的產業別
    const data = indices.filter(index => index.symbol);

    return data;
  }

  async fetchEquitiesQuotes(date: string) {
    // `date` 轉換成 `民國年/MM/dd` 格式
    const dt = DateTime.fromISO(date);
    const year = dt.get('year') - 1911;
    const formattedDate = `${year}/${dt.toFormat('MM/dd')}`;

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      l: 'zh-tw',       // 指定語系為正體中文
      d: formattedDate, // 指定資料日期
      o: 'json',        // 指定回應格式為 JSON
    });
    const url = `https://www.tpex.org.tw/web/stock/aftertrading/daily_close_quotes/stk_quote_result.php?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then(response => (response.data.iTotalRecords > 0) ? response.data : null);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const data = responseData.aaData
      .filter(row => !isWarrant(row[0]))  // 過濾權證
      .map(row => {
        const [ symbol, name, ...values ] = row;
        const [
          closePrice,   // 收盤價
          change,       // 漲跌
          openPrice,    // 開盤價
          highPrice,    // 最高價
          lowPrice,     // 最低價
          avgPrice,     // 均價
          tradeVolume,  // 成交股數
          tradeValue,   // 成交金額
          transaction,  // 成交筆數
        ] = values.slice(0, 9).map(value => numeral(value).value());

        // 回推參考價
        const referencePrice = (closePrice && change !== null) && numeral(closePrice).subtract(change).value() || null;

        // 計算漲跌幅
        const changePercent = (closePrice && change !== null) && +numeral(change).divide(referencePrice).multiply(100).format('0.00') || null;

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
    // `date` 轉換成 `民國年/MM/dd` 格式
    const dt = DateTime.fromISO(date);
    const year = dt.get('year') - 1911;
    const formattedDate = `${year}/${dt.toFormat('MM/dd')}`;

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      l: 'zh-tw',       // 指定語系為正體中文
      o: 'json',        // 指定回應格式為 JSON
      se: 'EW',         // 指定所有證券(不含權證、牛熊證)
      t: 'D',           // 指定日報表
      d: formattedDate, // 指定資料日期
    });
    const url = `https://www.tpex.org.tw/web/stock/3insti/daily_trade/3itrade_hedge_result.php?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then((response) => response.data.iTotalRecords > 0 ? response.data : null);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const data = responseData.aaData.reduce((tickers, raw) => {
      const [ symbol, name, ...values ] = raw;
      const [
        foreignDealersExcludedBuy,        // 外資及陸資(不含外資自營商)買進股數
        foreignDealersExcludedSell,       // 外資及陸資(不含外資自營商)賣出股數
        foreignDealersExcludedNetBuySell, // 外資及陸資(不含外資自營商)買賣超股數
        foreignDealersBuy,                // 外資自營商買進股數
        foreignDealersSell,               // 外資自營商賣出股數
        foreignDealersNetBuySell,         // 外資自營商買賣超股數
        foreignInvestorsBuy,              // 外資及陸資買進股數
        foreignInvestorsSell,             // 外資及陸資賣出股數
        foreignInvestorsNetBuySell,       // 外資及陸資買賣超股數
        sitcBuy,                          // 投信買進股數
        sitcSell,                         // 投信賣出股數
        sitcNetBuySell,                   // 投信買賣超股數
        dealersProprietaryBuy,            // 自營商(自行買賣)買進股數
        dealersProprietarySell,           // 自營商(自行買賣)賣出股數
        dealersProprietaryNetBuySell,     // 自營商(自行買賣)買賣超股數
        dealersHedgeBuy,                  // 自營商(避險)買進股數
        dealersHedgeSell,                 // 自營商(避險)賣出股數
        dealersHedgeNetBuySell,           // 自營商(避險)買賣超股數
        dealersBuy,                       // 自營商買進股數
        dealersSell,                      // 自營商賣出股數
        dealersNetBuySell,                // 自營商買賣超股數
        instInvestorsNetBuySell,          // 三大法人買賣超股數合計
      ] = values.map(value => numeral(value).value());

      const ticker = {
        date,
        symbol,
        name,
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

  async fetchEquitiesValues(date: string) {
    // `date` 轉換成 `民國年/MM/dd` 格式
    const dt = DateTime.fromISO(date);
    const year = dt.get('year') - 1911;
    const formattedDate = `${year}/${dt.toFormat('MM/dd')}`;

    // 建立 URL 查詢參數
    const query = new URLSearchParams({
      l: 'zh-tw',       // 指定語系為正體中文
      o: 'json',        // 指定回應格式為 JSON
      d: formattedDate, // 指定資料日期
    });
    const url = `https://www.tpex.org.tw/web/stock/aftertrading/peratio_analysis/pera_result.php?${query}`;

    // 取得回應資料
    const responseData = await firstValueFrom(this.httpService.get(url))
      .then((response) => response.data.iTotalRecords > 0 ? response.data : null);

    // 若該日期非交易日或尚無成交資訊則回傳 null
    if (!responseData) return null;

    // 整理回應資料
    const data = responseData.aaData.reduce((tickers, row) => {
      const [ symbol, name, peRatio, dividendPerShare, dividendYear, dividendYield, pbRatio ] = row;
      const ticker = {
        date,
        symbol,
        name,
        peRatio: numeral(peRatio).value(),  // 本益比
        pbRatio: numeral(pbRatio).value(),  // 股價淨值比
        dividendYield: numeral(dividendYield).value(),  // 殖利率
        dividendYear: dividendYear + 1911,  // 股利年度
      };
      return [ ...tickers, ticker ];
    }, []);

    return data;
  }
}
