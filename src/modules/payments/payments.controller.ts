import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { PaymentResponse } from 'src/types/response/payment.type';
import { WebResponse } from 'src/types/response/response.type';
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
  async webhook(@Body() payload: any): Promise<WebResponse> {
    const result = await this.paymentsService.handleWebhook(payload);
    return {
      message: result.message || 'Webhook received',
    };
  }

  @Roles('traveller')
  @Get('find-all')
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser() user: any): Promise<WebResponse> {
    const result = await this.paymentsService.findAllPayments(user.id);
    return {
      message: result.message,
      data: result.datas,
    };
  }

  @Roles('admin', 'owner', 'traveller')
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<WebResponse> {
    const result = await this.paymentsService.findOnePayment(id);
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Roles('owner')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}
