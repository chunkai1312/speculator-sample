import { Test, TestingModule } from '@nestjs/testing';
import { TraderController } from './trader.controller';
import { TraderService } from './trader.service';

describe('TraderController', () => {
  let traderController: TraderController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TraderController],
      providers: [TraderService],
    }).compile();

    traderController = app.get<TraderController>(TraderController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(traderController.getHello()).toBe('Hello World!');
    });
  });
});
