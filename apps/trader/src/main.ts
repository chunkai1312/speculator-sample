import { NestFactory } from '@nestjs/core';
import { TraderModule } from './trader.module';

async function bootstrap() {
  const app = await NestFactory.create(TraderModule);
  await app.listen(3000);
}
bootstrap();
