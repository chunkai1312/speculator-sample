import * as ExcelJS from 'exceljs';
import * as numeral from 'numeral';
import { Injectable } from '@nestjs/common';
import { Market, getMarketName, getSectorName } from '@speculator/common';
import { MarketStatsRepository } from '../market-stats/market-stats.repository';
import { TickerRepository } from '../ticker/ticker.repository';
import { getFontColorByNetChange } from './utils';

@Injectable()
export class ReportService {
  constructor(
    private readonly marketStatsRepository: MarketStatsRepository,
    private readonly tickerRepository: TickerRepository,
  ) {}

  async createWorkbook() {
    const workbook = new ExcelJS.Workbook();
    return workbook;
  }

  async addMarketStatsSheet(workbook: ExcelJS.Workbook, options: { date: string }) {
    const worksheet = workbook.addWorksheet();

    worksheet.columns = [
      { header: '日期', key: 'date', width: 10, style: { alignment: { vertical: 'middle', horizontal: 'center' } } },
      { header: '加權指數', key: 'taiexPrice', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffcdd2' } } } },
      { header: '漲跌', key: 'taiexChange', width: 12.5, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffcdd2' } } } },
      { header: '漲跌幅', key: 'taiexChangePercent', width: 12.5, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffcdd2' } } } },
      { header: '成交量(億)', key: 'taiexTradeValue', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffcdd2' } } } },
      { header: '外資\r\n買賣超(億)', key: 'finiNetBuySell', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'fff9c4' } } } },
      { header: '投信\r\n買賣超(億)', key: 'sitcNetBuySell', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'fff9c4' } } } },
      { header: '自營商\r\n買賣超(億)', key: 'dealersNetBuySell', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'fff9c4' } } } },
      { header: '融資\r\n餘額(億)', key: 'marginBalance', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'c8e6c9' } } } },
      { header: '融資\r\n餘額增減(億)', key: 'marginBalanceChange', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'c8e6c9' } } } },
      { header: '融券\r\n餘額(張)', key: 'shortBalance', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'c8e6c9' } } } },
      { header: '融券\r\n餘額增減(張)', key: 'shortBalanceChange', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'c8e6c9' } } } },
      { header: '外資台指期\r\nOI淨口數', key: 'finiTxfNetOi', width: 17.5, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'bbdefb' } } } },
      { header: '外資台指期\r\nOI淨口數增減', key: 'finiTxfNetOiChange', width: 17.5, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'bbdefb' } } } },
      { header: '外資台指買權\r\nOI淨金額(億)', key: 'finiTxoCallsNetOiValue', width: 17.5, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'b3e5fc' } } } },
      { header: '外資台指買權\r\nOI淨金額增減(億)', key: 'finiTxoCallsNetOiValueChange', width: 17.5, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'b3e5fc' } } } },
      { header: '外資台指賣權\r\nOI淨金額(億)', key: 'finiTxoPutsNetOiValue', width: 17.5, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'b3e5fc' } } } },
      { header: '外資台指賣權\r\nOI淨金額增減(億)', key: 'finiTxoPutsNetOiValueChange', width: 17.5, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'b3e5fc' } } } },
      { header: '十大特法台指\r\n近月OI淨口數', key: 'top10SpecificTxfFrontMonthNetOi', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'b2ebf2' } } } },
      { header: '十大特法台指\r\n近月OI淨口數增減', key: 'top10SpecificTxfFrontMonthNetOiChange', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'b2ebf2' } } } },
      { header: '十大特法台指\r\n遠月OI淨口數', key: 'top10SpecificTxfBackMonthsNetOi', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'b2ebf2' } } } },
      { header: '十大特法台指\r\n遠月OI淨口數增減', key: 'top10SpecificTxfBackMonthsNetOiChange', width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'b2ebf2' } } } },
      { header: '散戶小台\r\nOI淨口數', key: 'retailMxfNetOi', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'b2dfdb' } } } },
      { header: '散戶小台\r\nOI淨口數增減', key: 'retailMxfNetOiChange', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'b2dfdb' } } } },
      { header: '散戶多空比', key: 'retailMtxLongShortRatio', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'b2dfdb' } } } },
      { header: '台指選擇權\r\nPut/Call Ratio', key: 'txoPutCallRatio', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'cfd8dc' } } } },
      { header: '美元/新台幣', key: 'usdtwd', width: 12.5, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffccbc' } } } },
      { header: '新台幣升貶', key: 'usdtwdChange', width: 12.5, style: { alignment: { vertical: 'middle', horizontal: 'center' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffccbc' } } } },
    ];

    const data = await this.marketStatsRepository.getMarketStats(options);

    data.forEach(row => {
      row = {
        ...row,
        taiexChangePercent: row.taiexChangePercent && numeral(row.taiexChangePercent).divide(100).value(),
        taiexTradeValue: row.taiexTradeValue && numeral(row.taiexTradeValue).divide(100000000).value(),
        finiNetBuySell: row.finiNetBuySell && numeral(row.finiNetBuySell).divide(100000000).value(),
        sitcNetBuySell: row.sitcNetBuySell && numeral(row.sitcNetBuySell).divide(100000000).value(),
        dealersNetBuySell: row.dealersNetBuySell && numeral(row.dealersNetBuySell).divide(100000000).value(),
        marginBalance: row.marginBalance && numeral(row.marginBalance).divide(100000).value(),
        marginBalanceChange: row.marginBalanceChange && numeral(row.marginBalanceChange).divide(100000).value(),
        finiTxoCallsNetOiValue: row.finiTxoCallsNetOiValue && numeral(row.finiTxoCallsNetOiValue).divide(100000).value(),
        finiTxoCallsNetOiValueChange: row.finiTxoCallsNetOiValueChange && numeral(row.finiTxoCallsNetOiValueChange).divide(100000).value(),
        finiTxoPutsNetOiValue: row.finiTxoPutsNetOiValue && numeral(row.finiTxoPutsNetOiValue).divide(100000).value(),
        finiTxoPutsNetOiValueChange: row.finiTxoPutsNetOiValueChange && numeral(row.finiTxoPutsNetOiValueChange).divide(100000).value(),
        usdtwdChange: row.usdtwdChange * -1,
      };

      const dataRow = worksheet.addRow(row);
      dataRow.getCell('date').style = { alignment: { horizontal: 'center' } };
      dataRow.getCell('taiexPrice').font = { color: { argb: getFontColorByNetChange(row.taiexChange) } };
      dataRow.getCell('taiexChange').style = { font: { color: { argb: getFontColorByNetChange(row.taiexChange) } } };
      dataRow.getCell('taiexChangePercent').style = { numFmt: '#0.00%', font: { color: { argb: getFontColorByNetChange(row.taiexChangePercent) } } };
      dataRow.getCell('taiexTradeValue').style = { numFmt: '#,##0.00' };
      dataRow.getCell('finiNetBuySell').style = { numFmt: '#,##0.00', font: { color: { argb: getFontColorByNetChange(row.finiNetBuySell) } } };
      dataRow.getCell('sitcNetBuySell').style = { numFmt: '#,##0.00', font: { color: { argb: getFontColorByNetChange(row.sitcNetBuySell) } } };
      dataRow.getCell('dealersNetBuySell').style = { numFmt: '#,##0.00', font: { color: { argb: getFontColorByNetChange(row.dealersNetBuySell) } } };
      dataRow.getCell('marginBalance').style = { numFmt: '#,##0.00' };
      dataRow.getCell('marginBalanceChange').style = { numFmt: '#,##0.00', font: { color: { argb: getFontColorByNetChange(row.marginPurchaseChange) } } };
      dataRow.getCell('shortBalance').style = { numFmt: '#,##0' };
      dataRow.getCell('shortBalanceChange').style = { numFmt: '#,##0', font: { color: { argb: getFontColorByNetChange(row.shortSaleChange) } } };
      dataRow.getCell('finiTxfNetOi').style = { numFmt: '#,##0', font: { color: { argb: getFontColorByNetChange(row.qfiiTxNetOi) } } };
      dataRow.getCell('finiTxfNetOiChange').style = { numFmt: '#,##0', font: { color: { argb: getFontColorByNetChange(row.qfiiTxNetOiChange) } } };
      dataRow.getCell('finiTxoCallsNetOiValue').style = { numFmt: '#,##0.00', font: { color: { argb: getFontColorByNetChange(row.finiTxoCallsNetOiValue) } } };
      dataRow.getCell('finiTxoCallsNetOiValueChange').style = { numFmt: '#,##0.00', font: { color: { argb: getFontColorByNetChange(row.finiTxoCallsNetOiValueChange) } } };
      dataRow.getCell('finiTxoPutsNetOiValue').style = { numFmt: '#,##0.00', font: { color: { argb: getFontColorByNetChange(row.finiTxoPutsNetOiValue) } } };
      dataRow.getCell('finiTxoPutsNetOiValueChange').style = { numFmt: '#,##0.00', font: { color: { argb: getFontColorByNetChange(row.finiTxoPutsNetOiValueChange) } } };
      dataRow.getCell('top10SpecificTxfFrontMonthNetOi').style = { numFmt: '#,##0', font: { color: { argb: getFontColorByNetChange(row.specificTop10TxFrontMonthNetOi) } } };
      dataRow.getCell('top10SpecificTxfFrontMonthNetOiChange').style = { numFmt: '#,##0', font: { color: { argb: getFontColorByNetChange(row.specificTop10TxFrontMonthNetOiChange) } } };
      dataRow.getCell('top10SpecificTxfBackMonthsNetOi').style = { numFmt: '#,##0', font: { color: { argb: getFontColorByNetChange(row.specificTop10TxBackMonthsNetOi) } } };
      dataRow.getCell('top10SpecificTxfBackMonthsNetOiChange').style = { numFmt: '#,##0', font: { color: { argb: getFontColorByNetChange(row.specificTop10TxBackMonthsNetOiChange) } } };
      dataRow.getCell('retailMxfNetOi').style = { numFmt: '#,##0', font: { color: { argb: getFontColorByNetChange(row.retailMxfNetOi) } } };
      dataRow.getCell('retailMxfNetOiChange').style = { numFmt: '#,##0', font: { color: { argb: getFontColorByNetChange(row.retailMxfNetOiChange) } } };
      dataRow.getCell('retailMtxLongShortRatio').style = { numFmt: '#0.00%', font: { color: { argb: getFontColorByNetChange(row.retailMtxLongShortRatio) } } };
      dataRow.getCell('txoPutCallRatio').style = { numFmt: '#0.00%' };
      dataRow.getCell('usdtwd').style = { numFmt: '0.000', font: { color: { argb: getFontColorByNetChange(row.usdtwdChange * -1) } }  };
      dataRow.getCell('usdtwdChange').style = { numFmt: '0.000', font: { color: { argb: getFontColorByNetChange(row.usdtwdChange * -1) } }  };
      dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ffffff' } };
      dataRow.height = 20;
    });

    const date = data[0].date.replace(/-/g, '');
    worksheet.name = `${date} 大盤籌碼`;

    return workbook;
  }

  async addMoneyFlowSheet(workbook: ExcelJS.Workbook, options: { date: string, market: Market }) {
    const worksheet = workbook.addWorksheet();

    worksheet.columns = [
      { header: '指數(類股)', key: 'name', width: 17.5, style: { alignment: { horizontal: 'left' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffe0b2' } } } },
      { header: '指數', key: 'closePrice', width: 12.5, style: { alignment: { horizontal: 'right' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffe0b2' } } } },
      { header: '漲跌', key: 'change', width: 12.5, style: { alignment: { horizontal: 'right' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffe0b2' } } } },
      { header: '漲跌幅', key: 'changePercent', width: 12.5, style: { alignment: { horizontal: 'right' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffe0b2' } } } },
      { header: '成交金額(億)', key: 'tradeValue', width: 12.5, style: { alignment: { horizontal: 'right' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffe0b2' } } } },
      { header: '昨日金額(億)', key: 'tradeValuePrev', width: 12.5, style: { alignment: { horizontal: 'right' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffe0b2' } } } },
      { header: '金額差(億)', key: 'tradeValueChange', width: 12.5, style: { alignment: { horizontal: 'right' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffe0b2' } } } },
      { header: '成交比重', key: 'tradeWeight', width: 12.5, style: { alignment: { horizontal: 'right' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffe0b2' } } } },
      { header: '昨日比重', key: 'tradeWeightPrev', width: 12.5, style: { alignment: { horizontal: 'right' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffe0b2' } } } },
      { header: '比重差', key: 'tradeWeightChange', width: 12.5, style: { alignment: { horizontal: 'right' }, fill: { type: 'pattern', pattern: 'solid', fgColor:{ argb: 'ffe0b2' } } } },
    ];

    const data = await this.tickerRepository.getMoneyFlow(options);

    data.forEach(row => {
      row = {
        ...row,
        name: getSectorName(row.name),
        changePercent: row.changePercent && numeral(row.changePercent).divide(100).value(),
        tradeValue: row.tradeValue && numeral(row.tradeValue).divide(100000000).value(),
        tradeValuePrev: row.tradeValuePrev && numeral(row.tradeValuePrev).divide(100000000).value(),
        tradeValueChange: row.tradeValueChange && numeral(row.tradeValueChange).divide(100000000).value(),
        tradeWeight: row.tradeWeight && numeral(row.tradeWeight).divide(100).value(),
        tradeWeightPrev: row.tradeWeightPrev && numeral(row.tradeWeightPrev).divide(100).value(),
        tradeWeightChange: row.tradeWeightChange && numeral(row.tradeWeightChange).divide(100).value(),
      };

      const dataRow = worksheet.addRow(row);
      dataRow.getCell('closePrice').style = { numFmt: '##0.00', font: { color: { argb: getFontColorByNetChange(row.change) } } };
      dataRow.getCell('change').style = { numFmt: '##0.00', font: { color: { argb: getFontColorByNetChange(row.change) } } };
      dataRow.getCell('changePercent').style = { numFmt: '#0.00%', font: { color: { argb: getFontColorByNetChange(row.change) } } };
      dataRow.getCell('tradeValue').style = { numFmt: '#,##0.00' };
      dataRow.getCell('tradeValuePrev').style = { numFmt: '#,##0.00' };
      dataRow.getCell('tradeValueChange').style = { numFmt: '#,##0.00', font: { color: { argb: getFontColorByNetChange(row.tradeValueChange) } } };
      dataRow.getCell('tradeWeight').style = { numFmt: '#0.00%' };
      dataRow.getCell('tradeWeightPrev').style = { numFmt: '#0.00%' };
      dataRow.getCell('tradeWeightChange').style = { numFmt: '#0.00%', font: { color: { argb: getFontColorByNetChange(row.tradeWeightChange) } } };
      dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ffffff' } };
      dataRow.height = 20;
    });

    const market = getMarketName(options.market);
    worksheet.name = `${market}資金流向`;
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 20;

    return workbook;
  }
}
