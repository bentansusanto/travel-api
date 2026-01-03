import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { WebResponse } from 'src/types/response/response.type';
import { BookToursService } from './book-tours.service';
import { CreateBookTourDto } from './dto/create-book-tour.dto';

@Controller('book-tours')
@Roles('traveller')
export class BookToursController {
  constructor(private readonly bookToursService: BookToursService) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  async create(
    @CurrentUser() user: any,
    @Body() createBookTourDto: CreateBookTourDto,
  ): Promise<WebResponse> {
    const result = await this.bookToursService.create(
      user.id,
      createBookTourDto,
    );
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Get('find-all')
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser() user: any): Promise<WebResponse> {
    const result = await this.bookToursService.findAll(user.id);
    return {
      message: result.message,
      data: result.datas,
    };
  }

  @Get('find/:id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<WebResponse> {
    const result = await this.bookToursService.findBookTourId(id, user.id);
    return {
      message: result.message,
      data: result.data,
    };
  }
}
