import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { BookMotorResponse } from 'src/types/response/book-motor.type';
import { WebResponse } from 'src/types/response/response.type';
import { User } from '../users/entities/user.entity';
import { BookMotorsService } from './book-motors.service';
import { CreateBookMotorDto } from './dto/create-book-motor.dto';

@Controller('book-motors')
export class BookMotorsController {
  constructor(private readonly bookMotorsService: BookMotorsService) {}

  @Roles('traveller')
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createBookMotorDto: CreateBookMotorDto,
    @CurrentUser() user: User,
  ): Promise<WebResponse> {
    const result = await this.bookMotorsService.create(
      createBookMotorDto,
      user,
    );
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Get('find-all')
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<BookMotorResponse> {
    return await this.bookMotorsService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<BookMotorResponse> {
    return await this.bookMotorsService.findOne(id);
  }

  @Roles('admin', 'owner', 'traveller')
  @Put('update-status/:id')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ): Promise<WebResponse> {
    await this.bookMotorsService.updateStatus(id, body.status as any);
    return {
      message: 'Booking status updated successfully',
    };
  }
}
