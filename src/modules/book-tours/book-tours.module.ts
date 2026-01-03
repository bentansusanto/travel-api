import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DestinationModule } from '../destination/destination.module';
import { UsersModule } from '../users/users.module';
import { BookToursController } from './book-tours.controller';
import { BookToursService } from './book-tours.service';
import { BookTourItems } from './entities/book-tour-items.entity';
import { BookTour } from './entities/book-tour.entity';

@Module({
  controllers: [BookToursController],
  providers: [BookToursService],
  imports: [
    TypeOrmModule.forFeature([BookTour, BookTourItems]),
    UsersModule,
    DestinationModule,
  ],
  exports: [BookToursService],
})
export class BookToursModule {}
