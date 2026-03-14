import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { MereksService } from './mereks.service';
import { CreateMerekDto, UpdateMerekDto } from './dto/create-merek.dto';
import { WebResponse } from 'src/types/response/response.type';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('mereks')
export class MereksController {
  constructor(private readonly mereksService: MereksService) {}

  @Roles('admin')
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createMerekDto: CreateMerekDto):Promise<WebResponse> {
    const result = await this.mereksService.create(createMerekDto);
    return{
      message: result.message,
      data: result.data
    }
  }

  @Public()
  @Get('find-all')
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<WebResponse> {
    const result = await this.mereksService.findAll();
    return {
      message: result.message,
      data: result.datas,
    };
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<WebResponse> {
    const result = await this.mereksService.findOne(id);
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Roles('admin')
  @Put('update/:id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateMerekDto: UpdateMerekDto): Promise<WebResponse> {
    const result = await this.mereksService.update(id, updateMerekDto);
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Roles('admin')
  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<WebResponse> {
    const result = await this.mereksService.remove(id);
    return {
      message: result.message,
    };
  }
}
