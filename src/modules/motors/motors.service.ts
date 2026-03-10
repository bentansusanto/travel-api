import { Injectable } from '@nestjs/common';
import { CreateMotorDto } from './dto/create-motor.dto';
import { UpdateMotorDto } from './dto/update-motor.dto';

@Injectable()
export class MotorsService {
  create(createMotorDto: CreateMotorDto) {
    return 'This action adds a new motor';
  }

  findAll() {
    return `This action returns all motors`;
  }

  findOne(id: number) {
    return `This action returns a #${id} motor`;
  }

  update(id: number, updateMotorDto: UpdateMotorDto) {
    return `This action updates a #${id} motor`;
  }

  remove(id: number) {
    return `This action removes a #${id} motor`;
  }
}
