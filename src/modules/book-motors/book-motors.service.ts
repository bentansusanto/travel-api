import { Injectable } from '@nestjs/common';
import { CreateBookMotorDto } from './dto/create-book-motor.dto';
import { UpdateBookMotorDto } from './dto/update-book-motor.dto';

@Injectable()
export class BookMotorsService {
  create(createBookMotorDto: CreateBookMotorDto) {
    return 'This action adds a new bookMotor';
  }

  findAll() {
    return `This action returns all bookMotors`;
  }

  findOne(id: number) {
    return `This action returns a #${id} bookMotor`;
  }

  update(id: number, updateBookMotorDto: UpdateBookMotorDto) {
    return `This action updates a #${id} bookMotor`;
  }

  remove(id: number) {
    return `This action removes a #${id} bookMotor`;
  }
}
