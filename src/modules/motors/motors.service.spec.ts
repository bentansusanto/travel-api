import { Test, TestingModule } from '@nestjs/testing';
import { MotorsService } from './motors.service';

describe('MotorsService', () => {
  let service: MotorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MotorsService],
    }).compile();

    service = module.get<MotorsService>(MotorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
