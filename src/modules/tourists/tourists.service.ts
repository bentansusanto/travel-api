import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  TouristResponse,
  TouristResponseSingle,
} from 'src/types/response/tourist.type';
import { Not, Repository } from 'typeorm';
import { Logger } from 'winston';
import { BookToursService } from '../book-tours/book-tours.service';
import { CreateManyTouristsDto } from './dto/create-many-tourists.dto';
import { CreateTouristDto, UpdateTouristDto } from './dto/create-tourist.dto';
import { Tourist } from './entities/tourist.entity';

@Injectable()
export class TouristsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    @InjectRepository(Tourist)
    private readonly touristRepository: Repository<Tourist>,
    private readonly bookTourService: BookToursService,
  ) {}
  // create tourist
  async createTourist(
    reqDto: CreateTouristDto,
    userId: string,
  ): Promise<TouristResponseSingle> {
    try {
      const findBookTour = await this.bookTourService.findBookTourId(
        reqDto.book_tour_id,
        userId,
      );

      if (!findBookTour || !findBookTour.data) {
        this.logger.error('Book tour not found');
        throw new HttpException('Book tour not found', HttpStatus.NOT_FOUND);
      }

      const newTourist = this.touristRepository.create({
        bookTour: { id: findBookTour.data.id },
        name: reqDto.name,
        gender: reqDto.gender,
        phone_number: reqDto.phone_number,
        nationality: reqDto.nationality,
        passport_number: reqDto.passport_number,
      });

      await this.touristRepository.save(newTourist);

      this.logger.debug('Success create tourist');

      return {
        message: 'Success create tourist',
        data: {
          id: newTourist.id,
          book_tour_id: findBookTour.data.id,
          name: newTourist.name,
          gender: newTourist.gender,
          phone_number: newTourist.phone_number,
          nationality: newTourist.nationality,
          passport_number: newTourist.passport_number,
        },
      };
    } catch (error) {
      this.logger.error('createTourist error', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during create tourist',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // create many tourists
  async createMany(
    reqDto: CreateManyTouristsDto,
    userId: string,
  ): Promise<TouristResponse> {
    try {
      const { book_tour_id, tourists } = reqDto;

      // 1. Check for duplicate passport numbers within the request array
      const passports = tourists.map((t) => t.passport_number);
      const uniquePassports = new Set(passports);
      if (uniquePassports.size !== passports.length) {
        throw new HttpException(
          'Duplicate passport numbers found in the request',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 2. Check if any of these passorts already exist in the database
      const existingTouristsWithPassport = await this.touristRepository.find({
        where: passports.map((p) => ({ passport_number: p })),
        select: ['passport_number'],
      });

      if (existingTouristsWithPassport.length > 0) {
        const found = existingTouristsWithPassport.map(
          (t) => t.passport_number,
        );
        throw new HttpException(
          `Passport numbers already registered: ${found.join(', ')}`,
          HttpStatus.CONFLICT,
        );
      }

      const findBookTour = await this.bookTourService.findBookTourId(
        book_tour_id,
        userId,
      );

      if (!findBookTour || !findBookTour.data) {
        throw new HttpException('Book tour not found', HttpStatus.NOT_FOUND);
      }

      const touristEntities = tourists.map((t) =>
        this.touristRepository.create({
          bookTour: { id: book_tour_id },
          name: t.name,
          gender: t.gender,
          phone_number: t.phone_number,
          nationality: t.nationality,
          passport_number: t.passport_number,
          created_at: new Date(),
          updated_at: new Date(),
        }),
      );

      const savedTourists = await this.touristRepository.save(touristEntities);

      return {
        message: 'Success create many tourists',
        data: {
          book_tour_id: findBookTour.data.id,
          tourists: savedTourists.map((t) => ({
            id: t.id,
            name: t.name,
            gender: t.gender,
            phone_number: t.phone_number,
            nationality: t.nationality,
            passport_number: t.passport_number,
          })),
        },
      };
    } catch (error) {
      this.logger.error('createMany error', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during create many tourists',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // find all tourists
  async findAll(userId: string): Promise<TouristResponse> {
    try {
      const tourists = await this.touristRepository.find({
        where: { bookTour: { user: { id: userId } } },
        relations: ['bookTour'],
      });
      if (!tourists || tourists.length === 0) {
        this.logger.error('Tourist not found');
        throw new HttpException('Tourist not found', HttpStatus.NOT_FOUND);
      }
      this.logger.debug('Success find all tourist');
      return {
        message: 'Success find all tourist',
        data: {
          book_tour_id: tourists[0].bookTour.id,
          tourists: tourists.map((t) => ({
            id: t.id,
            name: t.name,
            gender: t.gender,
            phone_number: t.phone_number,
            nationality: t.nationality,
            passport_number: t.passport_number,
          })),
        },
      };
    } catch (error) {
      this.logger.error('findAll error', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during find all tourist',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // find tourist by id
  async findTouristById(id: string): Promise<TouristResponseSingle> {
    try {
      const tourist = await this.touristRepository.findOne({
        where: { id },
        relations: ['bookTour'],
      });
      if (!tourist) {
        this.logger.error('Tourist not found');
        throw new HttpException('Tourist not found', HttpStatus.NOT_FOUND);
      }

      this.logger.debug(`Success find by id tourist ${id}`);

      return {
        message: `Success find by id tourist ${id}`,
        data: {
          book_tour_id: tourist.bookTour.id,
          id: tourist.id,
          name: tourist.name,
          gender: tourist.gender,
          phone_number: tourist.phone_number,
          nationality: tourist.nationality,
          passport_number: tourist.passport_number,
        },
      };
    } catch (error) {
      this.logger.error('findById error', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during find by id tourist',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // update tourist
  async update(
    id: string,
    reqDto: UpdateTouristDto,
    userId: string,
  ): Promise<TouristResponseSingle> {
    try {
      const findTourist = await this.findTouristById(id);

      const findBookTour = await this.bookTourService.findBookTourId(
        findTourist.data.book_tour_id,
        userId,
      );

      if (!findBookTour || !findBookTour.data) {
        this.logger.error('Book tour not found');
        throw new HttpException('Book tour not found', HttpStatus.NOT_FOUND);
      }

      // Check if passport_number is being updated and if it's already used by another tourist
      if (reqDto.passport_number) {
        const existingTouristWithPassport =
          await this.touristRepository.findOne({
            where: {
              passport_number: reqDto.passport_number,
              id: Not(id), // Not ID of the current tourist
            },
          });

        if (existingTouristWithPassport) {
          throw new HttpException(
            `Passport number ${reqDto.passport_number} is already in use by another tourist`,
            HttpStatus.CONFLICT,
          );
        }
      }

      await this.touristRepository.update(id, {
        name: reqDto.name,
        gender: reqDto.gender,
        phone_number: reqDto.phone_number,
        nationality: reqDto.nationality,
        passport_number: reqDto.passport_number,
        updated_at: new Date(),
      });

      this.logger.debug(`Success update tourist ${id}`);

      return {
        message: `Success update tourist ${id}`,
        data: {
          id: findTourist.data.id,
          book_tour_id: findTourist.data.book_tour_id,
          name: findTourist.data.name,
          gender: findTourist.data.gender,
          phone_number: findTourist.data.phone_number,
          nationality: findTourist.data.nationality,
          passport_number: findTourist.data.passport_number,
        },
      };
    } catch (error) {
      this.logger.error('update error', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during update tourist',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // remove tourist
  async remove(id: string, userId: string): Promise<TouristResponse> {
    try {
      const findTourist = await this.findTouristById(id);

      if (!findTourist || !findTourist.data) {
        this.logger.error('Tourist not found');
        throw new HttpException('Tourist not found', HttpStatus.NOT_FOUND);
      }

      // Verify ownership of the book tour
      const findBookTour = await this.bookTourService.findBookTourId(
        findTourist.data.book_tour_id,
        userId,
      );

      if (!findBookTour || !findBookTour.data) {
        throw new HttpException('Permission denied', HttpStatus.FORBIDDEN);
      }

      await this.touristRepository.delete(id);

      this.logger.debug(`Success delete tourist ${id}`);

      return {
        message: 'Success delete tourist',
      };
    } catch (error) {
      this.logger.error('remove error', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during remove tourist',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
