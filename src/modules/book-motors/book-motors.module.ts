import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookMotorsService } from './book-motors.service';
import { BookMotorsController } from './book-motors.controller';
import { BookMotor } from './entities/book-motor.entity';
import { BookMotorItem } from './entities/book-motor-item.entity';
import { Tourist } from '../tourists/entities/tourist.entity';
import { Motor } from '../motors/entities/motor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookMotor, BookMotorItem, Tourist, Motor])
  ],
  controllers: [BookMotorsController],
  providers: [BookMotorsService],
  exports: [BookMotorsService]
})
export class BookMotorsModule {}
