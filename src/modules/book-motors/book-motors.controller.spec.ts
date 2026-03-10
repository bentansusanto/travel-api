import { Test, TestingModule } from '@nestjs/testing';
import { BookMotorsController } from './book-motors.controller';
import { BookMotorsService } from './book-motors.service';

describe('BookMotorsController', () => {
  let controller: BookMotorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookMotorsController],
      providers: [BookMotorsService],
    }).compile();

    controller = module.get<BookMotorsController>(BookMotorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
