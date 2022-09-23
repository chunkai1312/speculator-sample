import { DateTime } from 'luxon';
import { Redis } from 'ioredis';
import { Injectable, OnApplicationBootstrap, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { InjectWebSocketClient } from '@fugle/realtime-nest';
import { InjectLineNotify, LineNotify } from 'nest-line-notify';
import { WebSocketClient } from '@fugle/realtime';
import { MonitorRepository } from './monitor.repository';
import { MonitorDocument } from './monitor.schema';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class MonitorService implements OnApplicationBootstrap {
  private readonly sockets = new Map<string, WebSocket>();

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectWebSocketClient() private readonly client: WebSocketClient,
    @InjectLineNotify() private readonly lineNotify: LineNotify,
    private readonly monitorRepository: MonitorRepository,
  ) {}

  async onApplicationBootstrap() {
    const monitors = await this.monitorRepository.getMonitors();
    await Promise.all(monitors.map(monitor => this.makeMonitoring(monitor)))
  }

  async getAlerts() {
    return this.monitorRepository.getAlerts();
  }

  async createAlert(createAlertDto: CreateAlertDto) {
    const monitor = await this.monitorRepository.createAlert(createAlertDto);
    await this.makeMonitoring(monitor);
    return monitor;
  }

  async removeAlert(id: string) {
    const monitor = await this.monitorRepository.getAlertById(id);

    if (!monitor) {
      throw new NotFoundException('alert not found');
    }
    await this.removeMonitor(monitor);

    return this.monitorRepository.removeAlertById(id);
  }

  private async removeMonitor(monitor: MonitorDocument) {
    const { _id, symbol, type } = monitor;
    const key = `monitors:${_id}`;
    const monitable = `monitors:${symbol}:${type}`;

    await this.redis.multi()
      .zrem(monitable, key)
      .del(key)
      .exec();
  }

  private async makeMonitoring(monitor: MonitorDocument) {
    const { _id, symbol, type, value } = monitor;
    const key = `monitors:${_id}`;
    const monitable = `monitors:${symbol}:${type}`;

    await this.redis.multi()
      .set(key, JSON.stringify(monitor))
      .zadd(monitable, value, key)
      .exec();

    if (this.sockets.has(symbol)) return;
    if (this.sockets.size === 5) {
      await this.removeAlert(_id);
      throw new ForbiddenException('monitor limit reached');
    }

    const socket = this.client.intraday.quote({ symbolId: symbol });
    socket.onmessage = (message) => this.checkMatches(JSON.parse(message.data));

    this.sockets.set(symbol, socket);
  }

  private async checkMatches(message: any) {
    if (message.data.info.type !== 'EQUITY') return;
    if (!message.data.quote.trade) return;

    const { symbolId: symbol } = message.data.info;
    const { price } = message.data.quote.trade;

    const matches = await Promise.all([
      this.redis.zrangebyscore(`monitors:${symbol}:price:gt`, '-inf', price),
      this.redis.zrangebyscore(`monitors:${symbol}:price:lt`, price, '+inf'),
    ]).then(members => [].concat.apply([], members));

    if (!matches.length) return;

    const monitors = await this.redis.mget(matches)
      .then(results => results.map(data => JSON.parse(data)));

    monitors.forEach(monitor => {
      if (monitor.alert) this.sendAlert(monitor, message.data.quote);
    });
  }

  private async sendAlert(monitor: MonitorDocument, quote: any) {
    const { _id, symbol, type, alert } = monitor;
    const key = `monitors:${_id}`;
    const monitable = `monitors:${symbol}:${type}`;
    const time = DateTime.fromISO(quote.trade.at).toFormat('yyyy/MM/dd HH:mm:ss');

    const message = [
      '',
      `<<${alert.title}>>`,
      `${alert.message}`,
      `成交價: ${quote.trade.price}`,
      `成交量: ${quote.total.tradeVolume}`,
      `時間: ${time}`,
    ].join('\n');

    await this.lineNotify.send({ message });
    await this.redis.multi().zrem(monitable, key).del(key).exec();
    await this.monitorRepository.removeAlertById(_id);
  }
}
