import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import { Logger } from 'winston';
import { Sale, SaleStatus } from './entities/sale.entity';

@Injectable()
export class SalesService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) {}

  async createSaleFromPayment(paymentData: any): Promise<void> {
    try {
      // Check if sale already exists for this payment
      const existingSale = await this.saleRepository.findOne({
        where: { payment: { id: paymentData.payment_id } },
      });

      if (existingSale) {
        this.logger.info(
          `Sale already exists for payment ${paymentData.payment_id}`,
        );
        return;
      }

      // Create sale record
      const sale = this.saleRepository.create({
        bookTour: { id: paymentData.book_tour_id },
        payment: { id: paymentData.payment_id },
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: SaleStatus.COMPLETED,
      });

      await this.saleRepository.save(sale);
      this.logger.info(
        `Sale created successfully for payment ${paymentData.payment_id}`,
      );
    } catch (error) {
      this.logger.error(`Error creating sale from payment: ${error.message}`);
      // Don't throw error - we don't want to break payment flow
    }
  }

  async getAllSales(): Promise<any> {
    try {
      const sales = await this.saleRepository.find({
        relations: ['bookTour', 'payment'],
        order: { created_at: 'DESC' },
      });

      return {
        message: 'Success get all sales',
        datas: sales.map((sale) => ({
          id: sale.id,
          date: sale.created_at,
          book_tour_id: sale.bookTour?.id || '',
          payment_id: sale.payment?.id || '',
          currency: sale.currency,
          amount: sale.amount,
          status: sale.status,
        })),
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getDailySales(): Promise<any> {
    try {
      const result = await this.saleRepository
        .createQueryBuilder('sale')
        .select("DATE_FORMAT(sale.created_at, '%Y-%m-%d')", 'label')
        .addSelect('SUM(sale.amount)', 'total')
        .groupBy('label')
        .orderBy('label', 'ASC')
        .getRawMany();
      return {
        message: 'Success get daily sales',
        data: result,
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getWeeklySales(): Promise<any> {
    try {
      const result = await this.saleRepository
        .createQueryBuilder('sale')
        .select("DATE_FORMAT(sale.created_at, '%Y-%u')", 'label')
        .addSelect('SUM(sale.amount)', 'total')
        .groupBy('label')
        .orderBy('label', 'ASC')
        .getRawMany();
      return {
        message: 'Success get weekly sales',
        data: result,
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getMonthlySales(): Promise<any> {
    try {
      const result = await this.saleRepository
        .createQueryBuilder('sale')
        .select("DATE_FORMAT(sale.created_at, '%Y-%m')", 'label')
        .addSelect('SUM(sale.amount)', 'total')
        .groupBy('label')
        .orderBy('label', 'ASC')
        .getRawMany();
      return {
        message: 'Success get monthly sales',
        data: result,
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getYearlySales(): Promise<any> {
    try {
      const result = await this.saleRepository
        .createQueryBuilder('sale')
        .select('YEAR(sale.created_at)', 'label')
        .addSelect('SUM(sale.amount)', 'total')
        .groupBy('label')
        .orderBy('label', 'ASC')
        .getRawMany();
      return {
        message: 'Success get yearly sales',
        data: result,
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getDashboardSummary(): Promise<any> {
    try {
      const totalRevenue = await this.saleRepository
        .createQueryBuilder('sale')
        .select('SUM(sale.amount)', 'total')
        .getRawOne();

      const totalOrders = await this.saleRepository.count();

      return {
        message: 'Success get dashboard summary',
        data: {
          totalRevenue: parseFloat(totalRevenue?.total || 0),
          totalOrders,
        },
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
