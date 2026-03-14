import { Test, TestingModule } from '@nestjs/testing';
import { MereksService } from './mereks.service';

describe('MereksService', () => {
  let service: MereksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MereksService],
    }).compile();

    service = module.get<MereksService>(MereksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
