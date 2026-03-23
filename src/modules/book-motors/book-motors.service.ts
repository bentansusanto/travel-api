import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DataSource, Repository } from 'typeorm';
import { Logger } from 'winston';
import { MotorPrice, PriceType } from '../motors/entities/motor-price.entity';
import { Motor } from '../motors/entities/motor.entity';
import { Tourist } from '../tourists/entities/tourist.entity';
import { User } from '../users/entities/user.entity';
import { CreateBookMotorDto } from './dto/create-book-motor.dto';
import { BookMotorItem } from './entities/book-motor-item.entity';
import { BookMotor, StatusBookMotor } from './entities/book-motor.entity';
import { BookMotorResponse, BookMotorData } from 'src/types/response/book-motor.type';
import { AddOn } from '../add-ons/entities/add-on.entity';
import { BookingAddOn } from '../add-ons/entities/booking-add-on.entity';

@Injectable()
export class BookMotorsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    @InjectRepository(BookMotor)
    private readonly bookMotorRepository: Repository<BookMotor>,
    @InjectRepository(BookMotorItem)
    private readonly bookMotorItemRepository: Repository<BookMotorItem>,
    @InjectRepository(Motor)
    private readonly motorRepository: Repository<Motor>,
    @InjectRepository(Tourist)
    private readonly touristRepository: Repository<Tourist>,
    @InjectRepository(AddOn)
    private readonly addOnRepository: Repository<AddOn>,
    @InjectRepository(BookingAddOn)
    private readonly bookingAddOnRepository: Repository<BookingAddOn>,
    private readonly dataSource: DataSource,
  ) {}

  private calculateRentalDays(start: Date, end: Date): number {
    const diffInMs = end.getTime() - start.getTime();
    return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  }

  private calculatePrice(days: number, prices: MotorPrice[]): number {
    const dailyPrice =
      prices.find((p) => p.price_type === PriceType.DAILY)?.price || 0;
    const weeklyPrice =
      prices.find((p) => p.price_type === PriceType.WEEKLY)?.price || 0;

    if (days >= 7 && weeklyPrice > 0) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      return (
        Number(weeks) * Number(weeklyPrice) +
        Number(remainingDays) * Number(dailyPrice)
      );
    }

    return Number(days) * Number(dailyPrice);
  }

  private mapToResponseData(booking: BookMotor): BookMotorData {
    return {
      id: booking.id,
      user_id: booking.user?.id,
      start_date: booking.start_date,
      end_date: booking.end_date,
      total_price: Number(booking.total_price),
      status: booking.status,
      book_motor_items: booking.book_motor_items?.map(item => ({
        id: item.id,
        motor_id: item.motor?.id,
        motor_name: item.motor?.translations?.[0]?.name_motor || 'N/A',
        price: Number(item.price),
        qty: item.qty,
        subtotal: Number(item.subtotal)
      })) || [],
      tourists: booking.tourists?.map(t => ({
        id: t.id,
        name: t.name,
        passport_number: t.passport_number,
        phone_number: t.phone_number
      })) || [],
      booking_add_ons: booking.booking_add_ons?.map(ba => ({
        id: ba.id,
        add_on_id: ba.add_on?.id,
        name: ba.add_on?.name,
        price: Number(ba.price_at_booking)
      })) || [],
      created_at: booking.created_at,
      updated_at: booking.updated_at
    };
  }

  async create(createBookMotorDto: CreateBookMotorDto, user: User): Promise<BookMotorResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { items, tourists, start_date, end_date, add_ons } = createBookMotorDto;
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const days = this.calculateRentalDays(startDate, endDate);

      if (days <= 0) {
        throw new HttpException(
          'Invalid rental duration',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 1. Create Header
      const bookMotor = this.bookMotorRepository.create({
        user,
        start_date: startDate,
        end_date: endDate,
        status: StatusBookMotor.PENDING,
        total_price: 0,
      });

      const savedHeader = await queryRunner.manager.save(bookMotor);
      let grandTotal = 0;

      // 2. Create Items & Calculate Pricing
      if (items && items.length > 0) {
        for (const itemDto of items) {
          const motor = await this.motorRepository.findOne({
            where: { id: itemDto.motor_id },
            relations: ['motor_prices', 'translations'],
          });

          if (!motor) {
            throw new HttpException(
              `Motor with ID ${itemDto.motor_id} not found`,
              HttpStatus.NOT_FOUND,
            );
          }

          const unitPrice = this.calculatePrice(days, motor.motor_prices);
          const subtotal = unitPrice * itemDto.qty;

          const bookItem = this.bookMotorItemRepository.create({
            book_motor: savedHeader,
            motor: motor,
            price: unitPrice,
            qty: itemDto.qty,
            subtotal: subtotal,
          });

          await queryRunner.manager.save(bookItem);
          
          // Update motor availability to unavailable
          motor.is_available = false;
          await queryRunner.manager.save(motor);
          
          grandTotal += subtotal;
        }
      }

      // 3. Create Tourists
      if (tourists && tourists.length > 0) {
        const touristEntities = tourists.map((t) => {
          return this.touristRepository.create({
            ...t,
            book_motor: savedHeader,
          });
        });
        await queryRunner.manager.save(touristEntities);
      }
      
      // 4. Create Booking Add-ons
      if (add_ons && add_ons.length > 0) {
        for (const addOnId of add_ons) {
          const addOn = await this.addOnRepository.findOne({ where: { id: addOnId } });
          if (addOn) {
            const bookingAddOn = this.bookingAddOnRepository.create({
              book_motor: savedHeader,
              add_on: addOn,
              price_at_booking: addOn.price,
            });
            await queryRunner.manager.save(bookingAddOn);
            grandTotal += Number(addOn.price);
          }
        }
      }

      // 4. Update Header with Grand Total
      savedHeader.total_price = grandTotal;
      await queryRunner.manager.save(savedHeader);

      await queryRunner.commitTransaction();
      this.logger.debug(`Booking created successfully: ${savedHeader.id}`);

      // Fetch full booking for response
      const fullBooking = await this.findOneRaw(savedHeader.id);

      return {
        message: 'Booking created successfully',
        data: this.mapToResponseData(fullBooking),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error creating motor booking', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during create motor booking',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  private async findOneRaw(id: string): Promise<BookMotor> {
    const booking = await this.bookMotorRepository.findOne({
      where: { id },
      relations: [
        'book_motor_items',
        'book_motor_items.motor',
        'book_motor_items.motor.translations',
        'tourists',
        'booking_add_ons',
        'booking_add_ons.add_on',
        'user',
      ],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async findAll(): Promise<BookMotorResponse> {
    try {
      const bookings = await this.bookMotorRepository.find({
        relations: [
          'book_motor_items',
          'book_motor_items.motor',
          'book_motor_items.motor.translations',
          'tourists',
          'booking_add_ons',
          'booking_add_ons.add_on',
          'user',
        ],
      });

      return {
        message: 'Bookings retrieved successfully',
        datas: bookings.map((b) => this.mapToResponseData(b)),
      };
    } catch (error) {
      this.logger.error('Error find all motor bookings', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during find all motor bookings',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<BookMotorResponse> {
    try {
      const booking = await this.findOneRaw(id);
      return {
        message: 'Booking retrieved successfully',
        data: this.mapToResponseData(booking),
      };
    } catch (error) {
      this.logger.error('Error find one motor booking', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during find one motor booking',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateStatus(id: string, status: StatusBookMotor): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const booking = await queryRunner.manager.findOne(BookMotor, {
        where: { id },
        relations: ['book_motor_items', 'book_motor_items.motor'],
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // Update booking status
      booking.status = status;
      await queryRunner.manager.save(booking);

      // Update motor availability
      if (booking.book_motor_items && booking.book_motor_items.length > 0) {
        const isAvailable =
          status === StatusBookMotor.COMPLETED ||
          status === StatusBookMotor.CANCELLED ||
          status === StatusBookMotor.DRAFT;

        for (const item of booking.book_motor_items) {
          if (item.motor) {
            item.motor.is_available = isAvailable;
            await queryRunner.manager.save(item.motor);
          }
        }
      }

      await queryRunner.commitTransaction();
      this.logger.debug(`Booking ${id} status updated to ${status}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error update booking status', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during update booking status',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
