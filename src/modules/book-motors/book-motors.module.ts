import { Module } from '@nestjs/common';
import { BookMotorsService } from './book-motors.service';
import { BookMotorsController } from './book-motors.controller';

@Module({
  controllers: [BookMotorsController],
  providers: [BookMotorsService],
})
export class BookMotorsModule {}
