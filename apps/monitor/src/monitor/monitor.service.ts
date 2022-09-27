import { omit } from 'lodash';
import { DateTime } from 'luxon';
import { Redis } from 'ioredis';
import { Injectable, Inject, Logger, OnApplicationBootstrap, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { InjectWebSocketClient } from '@fugle/realtime-nest';
import { InjectLineNotify, LineNotify } from 'nest-line-notify';
import { WebSocketClient } from '@fugle/realtime';
import { TRADER_SERVICE } from '@speculator/common';
import { MonitorRepository } from './monitor.repository';
import { MonitorDocument } from './monitor.schema';
import { CreateAlertDto } from './dto/create-alert.dto';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class MonitorService implements OnApplicationBootstrap {
  private readonly sockets = new Map<string, WebSocket>();

  constructor(
    @Inject(TRADER_SERVICE) private readonly traderService: ClientProxy,
    @InjectRedis() private readonly redis: Redis,
    @InjectWebSocketClient() private readonly client: WebSocketClient,
    @InjectLineNotify() private readonly lineNotify: LineNotify,
    private readonly monitorRepository: MonitorRepository,
  ) {}

  async onApplicationBootstrap() {
    // 取得所有未觸發的監控設定並進行監控
    const monitors = await this.monitorRepository.getMonitors();
    await Promise.all(monitors.map(monitor => this.makeMonitoring(monitor)))
  }

  async getAlerts() {
    // 取得所有到價提醒
    return this.monitorRepository.getAlerts();
  }

  async createAlert(createAlertDto: CreateAlertDto) {
    // 建立到價提醒並進行監控
    const monitor = await this.monitorRepository.createAlert(createAlertDto);
    await this.makeMonitoring(monitor);
    return omit(monitor.toJSON(), ['__v', 'createdAt', 'updatedAt']);
  }

  async removeAlert(id: string) {
    const monitor = await this.monitorRepository.getAlert(id);

    // 若不存在則回傳 404 錯誤
    if (!monitor) throw new NotFoundException('alert not found');

    // 移除監控設定並刪除到價提醒
    await this.removeMonitor(monitor);
    return this.monitorRepository.removeAlert(id);
  }

  async getOrders() {
    // 取得所有觸價委託
    return this.monitorRepository.getOrders();
  }

  async createOrder(createOrderDto: CreateOrderDto) {
    // 建立觸價委託並進行監控
    const monitor = await this.monitorRepository.createOrder(createOrderDto);
    await this.makeMonitoring(monitor);
    return omit(monitor.toJSON(), ['__v', 'createdAt', 'updatedAt']);
  }

  async removeOrder(id) {
    const monitor = await this.monitorRepository.getOrder(id);

    // 若不存在則回傳 404 錯誤
    if (!monitor) {
      throw new NotFoundException('order not found');
    }

    // 移除監控設定並刪除觸價委託
    await this.removeMonitor(monitor);
    return this.monitorRepository.removeOrder(id);
  }

  private async removeMonitor(monitor: MonitorDocument) {
    const { _id, symbol, type } = monitor;
    const key = `monitors:${_id}`;
    const monitable = `monitors:${symbol}:${type}`;

    // 移除監控設定快取
    await this.redis.multi()
      .zrem(monitable, key)
      .del(key)
      .exec();
  }

  private async makeMonitoring(monitor: MonitorDocument) {
    const { _id, symbol, type, value } = monitor;
    const key = `monitors:${_id}`;
    const monitable = `monitors:${symbol}:${type}`;

    // 寫入監控設定快取
    await this.redis.multi()
      .set(key, JSON.stringify(monitor))
      .zadd(monitable, value, key)
      .exec();

    // 監控的股票已存在則不需建立重複的 WebSocket 連線
    if (this.sockets.has(symbol)) return;

    // 若達 WebSocket 連線數量上限則拋出例外
    if (this.sockets.size === 5) {
      await this.removeAlert(_id);
      throw new ForbiddenException('monitor limit reached');
    }

    // 建立富果行情 WebSocket 連線
    const socket = this.client.intraday.quote({ symbolId: symbol });
    socket.onmessage = (message) => this.checkMatches(JSON.parse(message.data));

    // 記錄監控的股票
    this.sockets.set(symbol, socket);
  }

  private async checkMatches(message: any) {
    // 非整股行情則結束函式
    if (message.data.info.type !== 'EQUITY') return;

    // 不包含最新成交價則結束函式
    if (!message.data.quote.trade) return;

    // 取出股票代號與最新成交價
    const { symbolId: symbol } = message.data.info;
    const { price } = message.data.quote.trade;

    // 按股票代號及最新成交價檢查匹配的監控設定 ID
    const matches = await Promise.all([
      this.redis.zrange(`monitors:${symbol}:price:gt`, '-inf', price, 'BYSCORE'),
      this.redis.zrange(`monitors:${symbol}:price:lt`, price, '+inf', 'BYSCORE'),
    ]).then(members => [].concat.apply([], members));

    // 若無滿足條件的監控設定則結束函式
    if (!matches.length) return;

    // 按監控設定 ID 取出匹配的監控設定
    const monitors = await this.redis.mget(matches)
      .then(results => results.map(data => JSON.parse(data)));

    for (const monitor of monitors) {
      await this.removeMonitor(monitor);  // 移除匹配的監控設定

      // 若監控設定包含 alert 則推播訊息
      if (monitor.alert) await this.sendAlert(monitor, message.data.quote);

      // 若監控設定包含 order 則下單委託
      if (monitor.order) await this.placeOrder(monitor, message.data.quote);
    }
  }

  private async sendAlert(monitor: MonitorDocument, quote: any) {
    const { _id, alert } = monitor;
    const time = DateTime.fromISO(quote.trade.at).toFormat('yyyy/MM/dd HH:mm:ss');

    // 設定推播訊息
    const message = [
      '',
      `<<${alert.title}>>`,
      `${alert.message}`,
      `成交價: ${quote.trade.price}`,
      `成交量: ${quote.total.tradeVolume}`,
      `時間: ${time}`,
    ].join('\n');

    // 透過 LINE Notify 推播訊息並將監控設定更新為已觸發
    await this.lineNotify.send({ message })
      .then(() => this.monitorRepository.triggerMonitor(_id))
      .catch((err) => Logger.error(err.message, err.stack, MonitorService.name));
  }

  private async placeOrder(monitor: MonitorDocument, quote: any) {
    const { _id, symbol, order } = monitor;
    const time = DateTime.fromISO(quote.trade.at).toFormat('yyyy/MM/dd HH:mm:ss');

    // 設定推播訊息
    const message = [
      '',
      `<<觸價委託>>`,
      `股票代號: ${symbol}`,
      `成交價: ${quote.trade.price}`,
      `成交量: ${quote.total.tradeVolume}`,
      `時間: ${time}`,
    ].join('\n');

    // 透過 Trader Service 進行下單委託
    this.traderService.emit('place-order', order);

    // 透過 LINE Notify 推播訊息並將監控設定更新為已觸發
    await this.lineNotify.send({ message })
      .then(() => this.monitorRepository.triggerMonitor(_id))
      .catch((err) => Logger.error(err.message, err.stack, MonitorService.name));
  }
}
