import { Test, TestingModule } from '@nestjs/testing';
import { MonitorController } from './monitor.controller';
import { MonitorService } from './monitor.service';

describe('MonitorController', () => {
  let monitorController: MonitorController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MonitorController],
      providers: [MonitorService],
    }).compile();

    monitorController = app.get<MonitorController>(MonitorController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(monitorController.getHello()).toBe('Hello World!');
    });
  });
});
