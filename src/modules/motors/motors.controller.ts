import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MotorsService } from './motors.service';
import { CreateMotorDto } from './dto/create-motor.dto';
import { UpdateMotorDto } from './dto/update-motor.dto';

@Controller('motors')
export class MotorsController {
  constructor(private readonly motorsService: MotorsService) {}

  @Post()
  create(@Body() createMotorDto: CreateMotorDto) {
    return this.motorsService.create(createMotorDto);
  }

  @Get()
  findAll() {
    return this.motorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.motorsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMotorDto: UpdateMotorDto) {
    return this.motorsService.update(+id, updateMotorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.motorsService.remove(+id);
  }
}
