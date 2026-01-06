import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { PaymentResponse } from 'src/types/response/payment.type';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles('traveller')
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponse> {
    const result = await this.paymentsService.createPayment(
      user.id,
      createPaymentDto,
    );
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Roles('traveller')
  @Post('capture/:orderId')
  @HttpCode(HttpStatus.OK)
  async capture(@Param('orderId') orderId: string): Promise<PaymentResponse> {
    const result = await this.paymentsService.capturePayment(orderId);
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Body() payload: any,
  ): Promise<{ message: string }> {
    const result = await this.paymentsService.handleWebhook(payload);
    return {
      message: result.message,
    };
  }

  @Roles('traveller')
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.paymentsService.findAll();
  }

  @Roles('admin', 'owner')
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Roles('owner')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}
