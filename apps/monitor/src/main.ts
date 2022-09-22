import { NestFactory } from '@nestjs/core';
import { MonitorModule } from './monitor.module';

async function bootstrap() {
  const app = await NestFactory.create(MonitorModule);
  await app.listen(3000);
}
bootstrap();
