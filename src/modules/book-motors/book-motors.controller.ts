import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BookMotorsService } from './book-motors.service';
import { CreateBookMotorDto } from './dto/create-book-motor.dto';
import { UpdateBookMotorDto } from './dto/update-book-motor.dto';

@Controller('book-motors')
export class BookMotorsController {
  constructor(private readonly bookMotorsService: BookMotorsService) {}

  @Post()
  create(@Body() createBookMotorDto: CreateBookMotorDto) {
    return this.bookMotorsService.create(createBookMotorDto);
  }

  @Get()
  findAll() {
    return this.bookMotorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookMotorsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookMotorDto: UpdateBookMotorDto) {
    return this.bookMotorsService.update(+id, updateBookMotorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookMotorsService.remove(+id);
  }
}
