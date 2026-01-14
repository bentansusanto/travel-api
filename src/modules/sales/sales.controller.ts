import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { SalesService } from './sales.service';

@Controller('sales')
@Roles('owner')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllSales() {
    const result = await this.salesService.getAllSales();
    return {
      message: result.message,
      data: result.datas,
    };
  }

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  async getSummary() {
    const result = await this.salesService.getDashboardSummary();
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Get('daily')
  @HttpCode(HttpStatus.OK)
  async getDaily() {
    const result = await this.salesService.getDailySales();
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Get('weekly')
  @HttpCode(HttpStatus.OK)
  async getWeekly() {
    const result = await this.salesService.getWeeklySales();
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Get('monthly')
  @HttpCode(HttpStatus.OK)
  async getMonthly() {
    const result = await this.salesService.getMonthlySales();
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Get('yearly')
  @HttpCode(HttpStatus.OK)
  async getYearly() {
    const result = await this.salesService.getYearlySales();
    return {
      message: result.message,
      data: result.data,
    };
  }
}
