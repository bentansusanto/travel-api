import { Test, TestingModule } from '@nestjs/testing';
import { AddOnsService } from './add-ons.service';

describe('AddOnsService', () => {
  let service: AddOnsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddOnsService],
    }).compile();

    service = module.get<AddOnsService>(AddOnsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
