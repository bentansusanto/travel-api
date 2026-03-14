import { Controller, Get, Post, Body, Patch, Param, Delete, Put, HttpCode, HttpStatus } from '@nestjs/common';
import { MotorsService } from './motors.service';
import { CreateMotorDto, UpdateMotorDto } from './dto/create-motor.dto';
import { WebResponse } from 'src/types/response/response.type';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';


@Controller('motors')
export class MotorsController {
  constructor(private readonly motorsService: MotorsService) {}

  @Roles('owner, admin')
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createMotorDto: CreateMotorDto):Promise<WebResponse> {
    const result = await this.motorsService.create(createMotorDto);
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Public()
  @Get('find-all')
  @HttpCode(HttpStatus.OK)
  async findAll():Promise<WebResponse> {
    const result = await this.motorsService.findAll();
    return {
      message: result.message,
      data: result.datas,
    };
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string):Promise<WebResponse> {
    const result = await this.motorsService.findOne(id);
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Roles('owner, admin')
  @Put('update/:id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateMotorDto: UpdateMotorDto):Promise<WebResponse> {
    const result = await this.motorsService.update(id, updateMotorDto);
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Roles('owner, admin')
  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string):Promise<WebResponse> {
    const result = await this.motorsService.remove(id);
    return {
      message: result.message,
    };
  }
}
