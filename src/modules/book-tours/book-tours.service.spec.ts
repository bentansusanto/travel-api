import { Test, TestingModule } from '@nestjs/testing';
import { BookToursService } from './book-tours.service';

describe('BookToursService', () => {
  let service: BookToursService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookToursService],
    }).compile();

    service = module.get<BookToursService>(BookToursService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
