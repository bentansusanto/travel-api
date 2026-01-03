import { Test, TestingModule } from '@nestjs/testing';
import { TouristsController } from './tourists.controller';
import { TouristsService } from './tourists.service';

describe('TouristsController', () => {
  let controller: TouristsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TouristsController],
      providers: [TouristsService],
    }).compile();

    controller = module.get<TouristsController>(TouristsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
