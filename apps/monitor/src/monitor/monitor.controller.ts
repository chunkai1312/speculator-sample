import { Controller, Get, Post, Delete, Body, Param, HttpCode } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Get('/alerts')
  async getAlerts() {
    return this.monitorService.getAlerts();
  }

  @Post('/alerts')
  async createAlert(@Body() createAlertDto: CreateAlertDto) {
    return this.monitorService.createAlert(createAlertDto);
  }

  @Delete('/alerts/:id')
  @HttpCode(204)
  async removeAlert(@Param('id') id: string) {
    return this.monitorService.removeAlert(id);
  }

  @Get('/orders')
  async getOrders() {
    return this.monitorService.getOrders();
  }

  @Post('/orders')
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.monitorService.createOrder(createOrderDto);
  }

  @Delete('/orders/:id')
  @HttpCode(204)
  async removeOrder(@Param('id') id: string) {
    return this.monitorService.removeOrder(id);
  }
}
