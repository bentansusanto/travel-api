import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { WebResponse } from 'src/types/response/response.type';
import { CountryService } from './country.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Roles('admin', 'owner')
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCountryDto: CreateCountryDto,
  ): Promise<WebResponse> {
    const response = await this.countryService.create(createCountryDto);
    return {
      message: 'Create country successfully',
      data: response,
    };
  }

  @Public()
  @Get('find-all')
  @HttpCode(HttpStatus.OK)
  async findAll():Promise<WebResponse> {
    const result = await this.countryService.findAll();
    return {
      message: result.message,
      data: result.datas,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string):Promise<WebResponse> {
    return this.countryService.findOne(id);
  }

  @Roles('admin', 'owner')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCountryDto: UpdateCountryDto,
  ) {
    return this.countryService.update(id, updateCountryDto);
  }

  @Roles('admin', 'owner')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.countryService.remove(+id);
  }
}
