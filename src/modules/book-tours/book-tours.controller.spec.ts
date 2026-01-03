import { Test, TestingModule } from '@nestjs/testing';
import { BookToursController } from './book-tours.controller';
import { BookToursService } from './book-tours.service';

describe('BookToursController', () => {
  let controller: BookToursController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookToursController],
      providers: [BookToursService],
    }).compile();

    controller = module.get<BookToursController>(BookToursController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
