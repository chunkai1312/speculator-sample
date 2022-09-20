import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportService {
  async createWorkbook() {
    const workbook = new ExcelJS.Workbook();
    return workbook;
  }
}
