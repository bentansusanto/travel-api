import { Test, TestingModule } from '@nestjs/testing';
import { BookMotorsService } from './book-motors.service';

describe('BookMotorsService', () => {
  let service: BookMotorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookMotorsService],
    }).compile();

    service = module.get<BookMotorsService>(BookMotorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
