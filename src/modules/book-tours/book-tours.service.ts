import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { TourResponse } from 'src/types/response/book-tour.type';
import { In, Repository } from 'typeorm';
import { Logger } from 'winston';
// import { CountryService } from '../country/country.service';
import { DestinationService } from '../destination/destination.service';
import { UsersService } from '../users/users.service';
import { CreateBookTourDto } from './dto/create-book-tour.dto';
import { BookTourItems } from './entities/book-tour-items.entity';
import { BookTour, StatusBookTour } from './entities/book-tour.entity';

@Injectable()
export class BookToursService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private readonly userService: UsersService,
    private readonly destinationService: DestinationService,
    @InjectRepository(BookTour)
    private readonly bookTourRepository: Repository<BookTour>,
    @InjectRepository(BookTourItems)
    private readonly bookTourItemsRepository: Repository<BookTourItems>,
  ) {}

  // Create Book Tour
  async create(
    userId: string,
    createBookTourDto: CreateBookTourDto,
  ): Promise<TourResponse> {
    try {
      const [findUser, findDestination] = await Promise.all([
        this.userService.findById(userId),
        this.destinationService.findDestinationById(
          createBookTourDto.destination_id,
        ),
      ]);

      if (!findUser) {
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (!findDestination || !findDestination.data) {
        this.logger.error('Destination not found');
        throw new HttpException('Destination not found', HttpStatus.NOT_FOUND);
      }

      const countryId = findDestination.data.country_id;

      if (!countryId) {
        this.logger.error('Country not found in destination');
        throw new HttpException(
          'Country not found in destination',
          HttpStatus.NOT_FOUND,
        );
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const newVisitDate = new Date(createBookTourDto.visit_date);
      const newVisitDateStart = new Date(newVisitDate);
      newVisitDateStart.setHours(0, 0, 0, 0);

      // 1. Check if visit date is earlier than today
      if (newVisitDateStart < today) {
        throw new HttpException(
          'Visit date cannot be earlier than today',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 2. Check if visit date is earlier than any previous booking for this user
      const lastBookingItem = await this.bookTourItemsRepository.findOne({
        where: { book_tour: { user: { id: findUser.id } } },
        order: { visit_date: 'DESC' },
        relations: ['book_tour', 'book_tour.user'],
      });

      if (lastBookingItem) {
        const lastVisitDate = new Date(lastBookingItem.visit_date);
        lastVisitDate.setHours(0, 0, 0, 0);

        if (newVisitDateStart < lastVisitDate) {
          throw new HttpException(
            'Visit date cannot be earlier than your previous booking (' +
              lastBookingItem.visit_date +
              ')',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // 2. Check if there's an existing DRAFT or PENDING book tour for the SAME country
      let bookTour = await this.bookTourRepository.findOne({
        where: {
          user: { id: findUser.id },
          country: { id: countryId },
          status: In([StatusBookTour.DRAFT, StatusBookTour.PENDING]),
        },
      });

      if (bookTour) {
        // Update updated_at and subtotal
        bookTour.updated_at = new Date();
        bookTour.subtotal =
          Number(bookTour.subtotal) + Number(findDestination.data.price);
        await this.bookTourRepository.save(bookTour);
      } else {
        // 3. If no existing tour for this country, create a new one
        bookTour = this.bookTourRepository.create({
          user: {
            id: findUser.id,
          },
          country: {
            id: countryId,
          },
          status: StatusBookTour.DRAFT,
          subtotal: findDestination.data.price,
          created_at: new Date(),
          updated_at: new Date(),
        });
        await this.bookTourRepository.save(bookTour);
      }

      // 4. Create the booking item
      const bookTourItem = this.bookTourItemsRepository.create({
        book_tour: { id: bookTour.id },
        destination: { id: findDestination.data.id },
        visit_date: newVisitDate,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await this.bookTourItemsRepository.save(bookTourItem);

      const findBookTour = await this.bookTourRepository.findOne({
        where: {
          id: bookTour.id,
        },
        relations: [
          'book_tour_items',
          'user',
          'country',
          'book_tour_items.destination',
        ],
      });

      if (!findBookTour) {
        throw new HttpException(
          'Book tour not found after creation',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        message: 'Success book tour',
        data: {
          id: findBookTour.id,
          user_id: findBookTour.user?.id || userId,
          country_id: findBookTour.country?.id || countryId,
          status: findBookTour.status,
          subtotal: findBookTour.subtotal,
          created_at: findBookTour.created_at,
          updated_at: findBookTour.updated_at,
          book_tour_items: (findBookTour.book_tour_items || []).map((item) => ({
            id: item.id,
            destination_id: item.destination?.id,
            visit_date: item.visit_date,
          })),
        },
      };
    } catch (error) {
      this.logger.error(
        `Create book tour error: ${error.message}`,
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
              body: 'Error during create book tour',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Find all book tour
  async findAll(userId: string): Promise<TourResponse> {
    try {
      const bookTours = await this.bookTourRepository.find({
        where: { user: { id: userId } },
        relations: [
          'book_tour_items',
          'user',
          'country',
          'book_tour_items.destination',
        ],
      });

      if (bookTours.length === 0) {
        this.logger.error('Book tour not found');
        throw new HttpException('Book tour not found', HttpStatus.NOT_FOUND);
      }

      return {
        message: 'Success get all book tour',
        datas: bookTours.map((bookTour) => ({
          id: bookTour.id,
          user_id: bookTour.user.id,
          country_id: bookTour.country.id,
          status: bookTour.status,
          subtotal: bookTour.subtotal,
          created_at: bookTour.created_at,
          updated_at: bookTour.updated_at,
          book_tour_items: bookTour.book_tour_items.map((item) => ({
            id: item.id,
            destination_id: item.destination.id,
            visit_date: item.visit_date,
          })),
        })),
      };
    } catch (error) {
      this.logger.error(
        `Find all book tour error: ${error.message}`,
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
              body: 'Error during find all book tour',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Find book tour by id
  async findBookTourId(id: string, userId: string): Promise<TourResponse> {
    try {
      const bookTour = await this.bookTourRepository.findOne({
        where: { id, user: { id: userId } },
        relations: [
          'book_tour_items',
          'user',
          'country',
          'book_tour_items.destination',
        ],
      });
      return {
        message: 'Success get book tour',
        data: {
          id: bookTour.id,
          user_id: bookTour.user.id,
          country_id: bookTour.country.id,
          status: bookTour.status,
          subtotal: bookTour.subtotal,
          created_at: bookTour.created_at,
          updated_at: bookTour.updated_at,
          book_tour_items: bookTour.book_tour_items.map((item) => ({
            id: item.id,
            destination_id: item.destination.id,
            visit_date: item.visit_date,
          })),
        },
      };
    } catch (error) {
      this.logger.error(`Find book tour error: ${error.message}`, error.stack);

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
              body: 'Error during find book tour',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
