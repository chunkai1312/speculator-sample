import { IsString, IsNumber, IsEnum } from 'class-validator';
import { MonitorType } from '../enums';

export class CreateAlertDto {
  @IsString()
  symbol: string;

  @IsEnum(MonitorType)
  type: MonitorType;

  @IsNumber()
  value: number;

  @IsString()
  title: string;

  @IsString()
  message: string;
}
