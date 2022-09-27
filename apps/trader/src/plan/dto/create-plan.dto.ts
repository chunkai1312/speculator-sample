import { IsString, IsNumber, IsArray, IsDateString } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  symbol: string;

  @IsNumber()
  price: number;

  @IsArray()
  days: number[];

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
