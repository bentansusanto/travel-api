import { Test, TestingModule } from '@nestjs/testing';
import { TouristsService } from './tourists.service';

describe('TouristsService', () => {
  let service: TouristsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TouristsService],
    }).compile();

    service = module.get<TouristsService>(TouristsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
