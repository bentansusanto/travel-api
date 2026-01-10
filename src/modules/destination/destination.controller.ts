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
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { WebResponse } from 'src/types/response/response.type';
import { DestinationService } from './destination.service';
import {
  CreateDestinationDto,
  UpdateDestinationDto,
} from './dto/create-destination.dto';
import {
  CreateTranslationDestinationDto,
  UpdateTranslationDestinationDto,
} from './dto/create-translation-destination.dto';

@Controller('destination')
export class DestinationController {
  constructor(private readonly destinationService: DestinationService) {}

  // create destination
  @Roles('admin', 'owner')
  @Post('/create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() reqDto: CreateDestinationDto): Promise<WebResponse> {
    const result = await this.destinationService.create(reqDto);
    return {
      message: result.message,
      data: result.data,
    };
  }

  // create translation destination
  @Roles('admin', 'owner')
  @Post('/:id/translation')
  @HttpCode(HttpStatus.CREATED)
  async createTranslation(
    @Param('id') id: string,
    @Body() reqDto: CreateTranslationDestinationDto,
  ): Promise<WebResponse> {
    const result = await this.destinationService.createTranslation(id, reqDto);
    return {
      message: result.message,
      data: result.data,
    };
  }

  // find all destination with translation
  @Public()
  @Get('/find-all-destination-with-translation')
  @HttpCode(HttpStatus.OK)
  async findAllDestinationWithTranslation(): Promise<WebResponse> {
    const result =
      await this.destinationService.findAllDestinationWithTranslation();
    return {
      message: result.message,
      data: result.datas,
    };
  }

  // find all categories destination
  @Public()
  @Get('/find-all-categories-destination')
  @HttpCode(HttpStatus.OK)
  async findAllCategoriesDestination(): Promise<WebResponse> {
    const result = await this.destinationService.findCategoryDestination();
    return {
      message: result.message,
      data: result.datas,
    };
  }

  // find destination by id
  @Public()
  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string): Promise<WebResponse> {
    const result = await this.destinationService.findDestinationById(id);
    return {
      message: result.message,
      data: result.data,
    };
  }

  // find destination by slug
  @Public()
  @Get('/slug/:slug')
  @HttpCode(HttpStatus.OK)
  async findBySlug(@Param('slug') slug: string): Promise<WebResponse> {
    const result = await this.destinationService.findDestinationBySlug(slug);
    return {
      message: result.message,
      data: result.data,
    };
  }

  // update destination
  @Roles('admin', 'owner')
  @Put('/:id/update')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() reqDto: UpdateDestinationDto,
  ): Promise<WebResponse> {
    const result = await this.destinationService.updateDestination(id, reqDto);
    return {
      message: result.message,
      data: result.data,
    };
  }

  // update translation destination
  @Roles('admin', 'owner')
  @Put('/:id/update-translation')
  @HttpCode(HttpStatus.OK)
  async updateTranslation(
    @Param('id') id: string,
    @Body() reqDto: UpdateTranslationDestinationDto,
  ): Promise<WebResponse> {
    const result = await this.destinationService.updateDestinationTranslation(
      id,
      reqDto,
    );
    return {
      message: result.message,
      data: result.data,
    };
  }

  // delete destination with translation
  @Roles('admin', 'owner')
  @Delete('/:id/delete')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<WebResponse> {
    const result = await this.destinationService.deleteDestination(id);
    return {
      message: result.message,
    };
  }
}
