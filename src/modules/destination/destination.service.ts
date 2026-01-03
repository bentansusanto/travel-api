import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  ResponseDestination,
  ResponseDestinationTranslation,
} from 'src/types/response/destination.type';
import { Repository } from 'typeorm';
import { Logger } from 'winston';
import { State } from '../country/entities/state.entity';
import {
  CreateDestinationDto,
  UpdateDestinationDto,
} from './dto/create-destination.dto';
import {
  CreateTranslationDestinationDto,
  UpdateTranslationDestinationDto,
} from './dto/create-translation-destination.dto';
import { CategoryDestination } from './entities/category_destination.entity';
import { DestinationTranslation } from './entities/destination-translation.entity';
import { Destination } from './entities/destination.entity';

@Injectable()
export class DestinationService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    @InjectRepository(Destination)
    private readonly destinationRepository: Repository<Destination>,
    @InjectRepository(DestinationTranslation)
    private readonly destinationTranslationRepository: Repository<DestinationTranslation>,
    @InjectRepository(CategoryDestination)
    private readonly categoryDestinationRepository: Repository<CategoryDestination>,
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
  ) {}

  private generateSlug(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-');
  }

  // create destination
  async create(reqDto: CreateDestinationDto): Promise<ResponseDestination> {
    try {
      // check if category destination exists
      const [findCategoryDestination, findState] = await Promise.all([
        this.categoryDestinationRepository.findOne({
          where: {
            id: reqDto.category_destination_id,
          },
        }),
        this.stateRepository.findOne({
          where: {
            id: reqDto.state_id,
          },
          relations: ['country'],
        }),
      ]);

      // check if category destination exists
      if (!findCategoryDestination) {
        this.logger.error('Category destination not found');
        throw new HttpException(
          'Category destination not found',
          HttpStatus.BAD_REQUEST,
        );
      }

      // check if state exists
      if (!findState) {
        this.logger.error('State not found');
        throw new HttpException('State not found', HttpStatus.BAD_REQUEST);
      }

      // create destination
      const destination = this.destinationRepository.create({
        category_destination: {
          id: findCategoryDestination.id,
        },
        state: {
          id: findState.id,
        },
        price: reqDto.price,
      });

      await this.destinationRepository.save(destination);

      this.logger.debug(`Destination created successfully`);

      return {
        message: 'Create destination successfully',
        data: {
          id: destination.id,
          category_destination_id: destination.category_destination.id,
          state_id: destination.state.id,
          location: `${findState.name}, ${findState.country.name}`,
          price: destination.price,
        },
      };
    } catch (error) {
      this.logger.error(
        `Create destination error: ${error.message}`,
        error.stack,
      );

      // If it's already an HttpException, just rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // For other unexpected errors
      throw new HttpException(
        {
          Error: [
            { field: 'general', body: 'Error during create destination' },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // create destination translation
  async createTranslation(
    destinationId: string,
    reqDto: CreateTranslationDestinationDto,
  ): Promise<ResponseDestinationTranslation> {
    try {
      // check destination id
      const destination = await this.destinationRepository.findOne({
        where: {
          id: destinationId,
        },
        relations: ['category_destination', 'state', 'state.country'],
      });

      // check if destination exists
      if (!destination) {
        this.logger.error('Destination not found');
        throw new HttpException(
          'Destination not found',
          HttpStatus.BAD_REQUEST,
        );
      }

      const genSlug = this.generateSlug(reqDto.name);

      // create destination translation
      const destinationTranslation =
        this.destinationTranslationRepository.create({
          destination: {
            id: destination.id,
          },
          language_code: reqDto.language_code,
          name: reqDto.name,
          slug: genSlug,
          description: reqDto.description,
          thumbnail: reqDto.thumbnail,
          image: Array.isArray(reqDto.image) ? reqDto.image : [],
          detail_tour: Array.isArray(reqDto.detail_tour)
            ? reqDto.detail_tour
            : [],
          facilities: Array.isArray(reqDto.facilities) ? reqDto.facilities : [],
        });

      await this.destinationTranslationRepository.save(destinationTranslation);

      this.logger.debug(`Destination translation created successfully`);

      return {
        message: 'Create translation destination successfully',
        data: {
          id: destinationTranslation.id,
          destination_id: destination.id,
          language_code: destinationTranslation.language_code,
          name: destinationTranslation.name,
          slug: destinationTranslation.slug,
          description: destinationTranslation.description,
          thumbnail: destinationTranslation.thumbnail,
          image: destinationTranslation.image,
          detail_tour: destinationTranslation.detail_tour,
          facilities: destinationTranslation.facilities,
          createdAt: destinationTranslation.createdAt,
          updatedAt: destinationTranslation.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error(
        `Create translation destination error: ${error.message}`,
        error.stack,
      );

      // If it's already an HttpException, just rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // For other unexpected errors
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during create translation destination',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // find all destination with translation
  async findAllDestinationWithTranslation(): Promise<ResponseDestination> {
    try {
      const destinations = await this.destinationRepository.find({
        relations: [
          'category_destination',
          'state',
          'state.country',
          'translations',
        ],
      });

      this.logger.debug(`Find all destination successfully`);

      if (!destinations || destinations.length === 0) {
        this.logger.error('Destination not found');
        throw new HttpException(
          'Destination not found',
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        message: 'Find all destination successfully',
        datas: destinations.map((item) => ({
          id: item.id,
          state_id: item.state.id,
          location: `${item.state.name}, ${item.state.country.name}`,
          category_destination_id: item.category_destination.id,
          category_destination_name: item.category_destination.name,
          price: item.price,
          translations: item.translations?.map((translation) => ({
            id: translation.id,
            destination_id: item.id,
            language_code: translation.language_code,
            name: translation.name,
            slug: translation.slug,
            description: translation.description,
            thumbnail: translation.thumbnail,
            image: translation.image,
            detail_tour: translation.detail_tour,
            facilities: translation.facilities,
            createdAt: translation.createdAt,
            updatedAt: translation.updatedAt,
          })),
        })),
      };
    } catch (error) {
      this.logger.error(
        `Find all destination error: ${error.message}`,
        error.stack,
      );

      // If it's already an HttpException, just rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // For other unexpected errors
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during find all destination',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // find category destination
  async findCategoryDestination(): Promise<any> {
    try {
      const categoryDestination =
        await this.categoryDestinationRepository.find();

      if (categoryDestination.length === 0) {
        this.logger.error('Category destination not found');
        throw new HttpException(
          'Category destination not found',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.debug(`Find category destination successfully`);

      return {
        message: 'Find category destination successfully',
        datas: categoryDestination.map((item) => ({
          id: item.id,
          name: item.name,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Find category destination error: ${error.message}`,
        error.stack,
      );

      // If it's already an HttpException, just rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // For other unexpected errors
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during find category destination',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // update destination
  async updateDestination(
    destinationId: string,
    reqDto: UpdateDestinationDto,
  ): Promise<ResponseDestination> {
    try {
      const destination = await this.destinationRepository.findOne({
        where: {
          id: destinationId,
        },
      });

      if (!destination) {
        this.logger.error('Destination not found');
        throw new HttpException(
          'Destination not found',
          HttpStatus.BAD_REQUEST,
        );
      }

      // check category and state
      const [findCategoryDestination, findState] = await Promise.all([
        this.categoryDestinationRepository.findOne({
          where: {
            id: reqDto.category_destination_id,
          },
        }),
        this.stateRepository.findOne({
          where: {
            id: reqDto.state_id,
          },
        }),
      ]);

      if (!findCategoryDestination || !findState) {
        this.logger.error('Category destination or state not found');
        throw new HttpException(
          'Category destination or state not found',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.destinationRepository.update(destinationId, reqDto);

      this.logger.debug(`Update destination successfully`);

      return {
        message: 'Update destination successfully',
        data: {
          id: destination.id,
          state_id: destination.state.id,
          location: `${destination.state.name}, ${destination.state.country.name}`,
          category_destination_id: destination.category_destination.id,
          price: destination.price,
        },
      };
    } catch (error) {
      this.logger.error(
        `Update destination error: ${error.message}`,
        error.stack,
      );

      // If it's already an HttpException, just rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // For other unexpected errors
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during update destination',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // update destination translation
  async updateDestinationTranslation(
    destinationId: string,
    reqDto: UpdateTranslationDestinationDto,
  ): Promise<ResponseDestination> {
    try {
      const findDestination = await this.destinationRepository.findOne({
        where: {
          id: destinationId,
        },
      });

      if (!findDestination) {
        this.logger.error('Destination not found');
        throw new HttpException(
          'Destination not found',
          HttpStatus.BAD_REQUEST,
        );
      }

      const genSlug = this.generateSlug(reqDto.name);

      await this.destinationTranslationRepository.update(destinationId, {
        destination: {
          id: destinationId,
        },
        language_code: reqDto.language_code,
        name: reqDto.name,
        slug: genSlug,
        description: reqDto.description,
        thumbnail: reqDto.thumbnail,
        image: Array.isArray(reqDto.image) ? reqDto.image : [],
        detail_tour: Array.isArray(reqDto.detail_tour)
          ? reqDto.detail_tour
          : [],
        facilities: Array.isArray(reqDto.facilities) ? reqDto.facilities : [],
      });

      this.logger.debug(`Update destination translation successfully`);

      return {
        message: 'Update destination translation successfully',
      };
    } catch (error) {
      this.logger.error(
        `Update destination translation error: ${error.message}`,
        error.stack,
      );

      // If it's already an HttpException, just rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // For other unexpected errors
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during update destination translation',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // delete destination
  async deleteDestination(destinationId: string): Promise<ResponseDestination> {
    try {
      const [findDestination, findDestinationTranslation] = await Promise.all([
        this.destinationRepository.findOne({
          where: {
            id: destinationId,
          },
        }),
        this.destinationTranslationRepository.find({
          where: {
            destination: {
              id: destinationId,
            },
          },
        }),
      ]);

      if (!findDestination) {
        this.logger.error('Destination not found');
        throw new HttpException(
          'Destination not found',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (findDestinationTranslation.length > 0) {
        await this.destinationTranslationRepository.delete(
          findDestinationTranslation.map((item) => item.id),
        );
      }

      await this.destinationRepository.delete(destinationId);

      if (findDestinationTranslation.length > 0) {
        await this.destinationTranslationRepository.delete(
          findDestinationTranslation.map((item) => item.id),
        );
      }

      await this.destinationRepository.delete(destinationId);

      this.logger.debug(`Delete destination successfully`);

      return {
        message: 'Delete destination successfully',
      };
    } catch (error) {
      this.logger.error(
        `Delete destination error: ${error.message}`,
        error.stack,
      );

      // If it's already an HttpException, just rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // For other unexpected errors
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during delete destination',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // find destination by id
  async findDestinationById(
    destinationId: string,
  ): Promise<ResponseDestination> {
    try {
      const findDestination = await this.destinationRepository.findOne({
        where: {
          id: destinationId,
        },
        relations: [
          'state',
          'state.country',
          'category_destination',
          'translations',
        ],
      });

      if (!findDestination) {
        this.logger.error('Destination not found');
        throw new HttpException(
          'Destination not found',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.debug(`Find destination by id successfully`);

      return {
        message: 'Find destination by id successfully',
        data: {
          id: findDestination.id,
          state_id: findDestination?.state?.id,
          location: `${findDestination?.state?.name}, ${findDestination?.state?.country?.name}`,
          category_destination_id: findDestination?.category_destination?.id,
          price: findDestination.price,
          country_id: findDestination?.state?.country?.id,
          translations: findDestination.translations?.map((item) => ({
            id: item.id,
            destination_id: findDestination.id,
            language_code: item.language_code,
            name: item.name,
            slug: item.slug,
            description: item.description,
            thumbnail: item.thumbnail,
            image: item.image,
            detail_tour: item.detail_tour,
            facilities: item.facilities,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          })),
        },
      };
    } catch (error) {
      this.logger.error(
        `Find destination by id error: ${error.message}`,
        error.stack,
      );

      // If it's already an HttpException, just rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // For other unexpected errors
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during find destination by id',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
