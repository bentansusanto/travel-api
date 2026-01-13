import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { WebResponse } from 'src/types/response/response.type';
import { CreateManyTouristsDto } from './dto/create-many-tourists.dto';
import { CreateTouristDto, UpdateTouristDto } from './dto/create-tourist.dto';
import { UpdateManyTouristsDto } from './dto/update-many-tourists.dto';
import { TouristsService } from './tourists.service';

@Controller('tourists')
@Roles('traveller')
export class TouristsController {
  constructor(private readonly touristsService: TouristsService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() createTouristDto: CreateTouristDto,
  ): Promise<WebResponse> {
    const result = await this.touristsService.createTourist(
      createTouristDto,
      user.id,
    );
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Post('create-many')
  @HttpCode(HttpStatus.CREATED)
  async createMany(
    @CurrentUser() user: any,
    @Body() createManyTouristsDto: CreateManyTouristsDto,
  ): Promise<WebResponse> {
    const result = await this.touristsService.createMany(
      createManyTouristsDto,
      user.id,
    );
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Get('find-all')
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser() user: any): Promise<WebResponse> {
    const result = await this.touristsService.findAll(user.id);
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Get('find/:id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<WebResponse> {
    const result = await this.touristsService.findTouristById(id);
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Put('update/:id')
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateTouristDto: UpdateTouristDto,
  ): Promise<WebResponse> {
    const result = await this.touristsService.update(
      id,
      updateTouristDto,
      user.id,
    );
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Put('update-many')
  @HttpCode(HttpStatus.OK)
  async updateMany(
    @CurrentUser() user: any,
    @Body() updateManyTouristsDto: UpdateManyTouristsDto,
  ): Promise<WebResponse> {
    const result = await this.touristsService.updateMany(
      updateManyTouristsDto,
      user.id,
    );
    return {
      message: result.message,
    };
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<WebResponse> {
    const result = await this.touristsService.remove(id, user.id);
    return {
      message: result.message,
    };
  }
}
