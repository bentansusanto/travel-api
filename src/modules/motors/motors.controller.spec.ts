import { Test, TestingModule } from '@nestjs/testing';
import { MotorsController } from './motors.controller';
import { MotorsService } from './motors.service';

describe('MotorsController', () => {
  let controller: MotorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MotorsController],
      providers: [MotorsService],
    }).compile();

    controller = module.get<MotorsController>(MotorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
