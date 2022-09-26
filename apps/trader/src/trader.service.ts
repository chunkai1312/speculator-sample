import { Injectable } from '@nestjs/common';

@Injectable()
export class TraderService {
  getHello(): string {
    return 'Hello World!';
  }
}
