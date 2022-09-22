import { Injectable } from '@nestjs/common';

@Injectable()
export class MonitorService {
  getHello(): string {
    return 'Hello World!';
  }
}
