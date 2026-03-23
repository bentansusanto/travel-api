import { Controller, Get, Post, Body, Param, Delete, Put, HttpCode, HttpStatus } from '@nestjs/common';
import { AddOnsService } from './add-ons.service';
import { CreateAddOnDto, UpdateAddOnDto } from './dto/create-add-on.dto';
import { WebResponse } from 'src/types/response/response.type';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('add-ons')
export class AddOnsController {
  constructor(private readonly addOnsService: AddOnsService) {}

  @Roles('owner, admin', 'developer')
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAddOnDto: CreateAddOnDto): Promise<WebResponse> {
    const result = await this.addOnsService.create(createAddOnDto);
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Get('find-all')
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<WebResponse> {
    const result = await this.addOnsService.findAll();
    return {
      message: result.message,
      data: result.datas,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<WebResponse> {
    const result = await this.addOnsService.findOne(id);
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Public()
  @Get('find-category/:category')
  @HttpCode(HttpStatus.OK)
  async findByCategory(@Param('category') category: string): Promise<WebResponse> {
    const result = await this.addOnsService.findByCategory(category);
    return {
      message: result.message,
      data: result.datas,
    };
  }

  @Roles('owner, admin', 'developer')
  @Put('update/:id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateAddOnDto: UpdateAddOnDto): Promise<WebResponse> {
    const result = await this.addOnsService.update(id, updateAddOnDto);
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Roles('owner, admin', 'developer')
  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<WebResponse> {
    const result = await this.addOnsService.remove(id);
    return {
      message: result.message,
    };
  }
}
