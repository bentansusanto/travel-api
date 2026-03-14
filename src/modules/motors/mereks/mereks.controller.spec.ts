import { Test, TestingModule } from '@nestjs/testing';
import { MereksController } from './mereks.controller';
import { MereksService } from './mereks.service';

describe('MereksController', () => {
  let controller: MereksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MereksController],
      providers: [MereksService],
    }).compile();

    controller = module.get<MereksController>(MereksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
