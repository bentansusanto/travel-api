import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PaymentResponse } from 'src/types/response/payment.type';
import { Repository } from 'typeorm';
import { Logger } from 'winston';
import { BookToursService } from '../book-tours/book-tours.service';
import { StatusBookTour } from '../book-tours/entities/book-tour.entity';
import { TouristsService } from '../tourists/tourists.service';
import { UsersService } from '../users/users.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from './entities/payment.entity';
import { PaypalService } from './paypal.service';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    private readonly bookToursService: BookToursService,
    private readonly usersService: UsersService,
    private readonly paypalService: PaypalService,
    private readonly touristService: TouristsService,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
  ) {}
  // paypal order
  private async payPalOrder(orderId: string, amount: number) {
    // Dapatkan token akses dari PayPal
    const accessToken = await this.paypalService.authPaypal();

    // buat order paypal
    const orderResponse = await fetch(
      `${process.env.PAYPAL_API}/v2/checkout/orders`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: 'USD',
                value: amount.toFixed(2),
              },
              description: `Order ID: ${orderId}`,
            },
          ],
          application_context: {
            // return_url: `http://localhost:8081/checkout`,
            // cancel_url: `http://localhost:8081`,
            // return_url: `http://localhost:3500/checkout`,
            // cancel_url: `http://localhost:3500/orders`,
            return_url: `http://localhost:8000/checkout`,
            cancel_url: `http://localhost:8000`,
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            brand_name: 'http://localhost:8000',
            // brand_name: 'http://localhost:3500',
          },
        }),
      },
    );

    const orderData = await orderResponse.json();
    if (!orderResponse.ok) {
      throw new Error(`PayPal Order Error: ${JSON.stringify(orderData)}`);
    }

    const payerEmail =
      orderData?.purchase_units?.[0]?.payee?.email_address || null;

    // Return approval link untuk redirect user
    return {
      approval_url: orderData.links.find((link: any) => link.rel === 'approve')
        .href,
      paypal_order_id: orderData.id,
      payer_email: payerEmail,
      orderData,
    };
  }

  // Create payment
  async createPayment(
    user_id: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponse> {
    try {
      // check user, booktour, tourist
      const [findUser, findBookTour, findTourist] = await Promise.all([
        this.usersService.findById(user_id),
        this.bookToursService.findBookTourId(
          createPaymentDto.book_tour_id,
          user_id,
        ),
        this.touristService.findTouristByBookTour(
          createPaymentDto.book_tour_id,
        ),
      ]);
      if (!findUser) {
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      if (!findBookTour || findBookTour.data.user_id !== user_id) {
        this.logger.error('Book tour not found');
        throw new HttpException('Book tour not found', HttpStatus.NOT_FOUND);
      }

      if (
        findBookTour.data.status !== StatusBookTour.PENDING &&
        findBookTour.data.status !== StatusBookTour.DRAFT
      ) {
        this.logger.error('Book tour is already paid');
        throw new HttpException(
          'Book tour is already paid',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!findTourist) {
        this.logger.error('Tourist not found');
        throw new HttpException('Tourist not found', HttpStatus.NOT_FOUND);
      }

      // calculate total amount
      const totalAmout =
        findBookTour.data.subtotal * findTourist.data.tourists.length;

      // create payment
      const newPayment = this.paymentsRepository.create({
        user: { id: user_id },
        bookTour: { id: createPaymentDto.book_tour_id },
        currency: createPaymentDto.currency,
        payment_method: createPaymentDto.payment_method,
        amount: totalAmout
      });
      await this.paymentsRepository.save(newPayment);

      // update book tour status
      await this.bookToursService.updateStatusBookTour(
        createPaymentDto.book_tour_id,
        StatusBookTour.PENDING,
      );

      // create condition for payment method
      let paymentPaypal: any;

      switch (newPayment.payment_method) {
        case PaymentMethod.PAYPAL:
          paymentPaypal = await this.payPalOrder(
            newPayment.id,
            newPayment.amount,
          );
          await this.paymentsRepository.update(newPayment.id, {
            redirect_url: paymentPaypal.approval_url,
            transactionId: paymentPaypal.paypal_order_id,
          });
          break;
        default:
          throw new HttpException(
            'Payment type not supported',
            HttpStatus.BAD_REQUEST,
          );
      }

      return {
        message: 'Success creating payment',
        data: {
          id: newPayment.id,
          user_id: newPayment.user.id,
          book_tour_id: newPayment.bookTour.id,
          total_tourists: findTourist.data.tourists.length,
          amount: newPayment.amount,
          currency: newPayment.currency,
          status: newPayment.status,
          payment_method: newPayment.payment_method,
          payer_email: paymentPaypal?.payer_email || null,
          transaction_id: paymentPaypal?.paypal_order_id || null,
          redirect_url: paymentPaypal?.approval_url || null,
          created_at: newPayment.created_at,
          updated_at: newPayment.updated_at,
        },
      };
    } catch (error) {
      this.logger.error(`Error creating payment: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // capture payment
  async capturePayment(orderId: string): Promise<PaymentResponse> {
    try {
      const payment = await this.paymentsRepository.findOne({
        where: { transactionId: orderId },
        relations: ['user', 'bookTour'],
      });

      if (!payment) {
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }

      const capture = await this.paypalService.capturePayment(orderId);

      // update payment status
      await this.paymentsRepository.update(payment.id, {
        status: PaymentStatus.SUCCES,
        payer_email: capture.payerEmail,
        redirect_url: null,
      });

      // update book tour status
      await this.bookToursService.updateStatusBookTour(
        payment.bookTour.id,
        StatusBookTour.ONGOING,
      );

      return {
        message: 'Success capturing payment',
        data: {
          id: payment.id,
          user_id: payment.user.id,
          book_tour_id: payment.bookTour.id,
          amount: payment.amount,
          currency: payment.currency,
          status: PaymentStatus.SUCCES,
          payment_method: payment.payment_method,
          payer_email: capture.payerEmail,
          transaction_id: orderId,
          created_at: payment.created_at,
          updated_at: new Date(),
        },
      };
    } catch (error) {
      this.logger.error(`Error capturing payment: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async handleWebhook(payload: any): Promise<PaymentResponse> {
    try {
      const eventType = payload.event_type;
      this.logger.info(`Received PayPal Webhook: ${eventType}`);
      this.logger.debug(`Webhook payload: ${JSON.stringify(payload)}`);

      // TODO: Verify webhook signature using headers
      // const webhookId = process.env.PAYPAL_WEBHOOK_ID;
      // await this.paypalService.verifyWebhookSignature(headers, payload, webhookId);

      let orderId: string | null = null;

      // Handle different PayPal webhook events
      switch (eventType) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          // Extract order ID from capture completed event
          orderId =
            payload.resource?.supplementary_data?.related_ids?.order_id ||
            payload.resource?.id;
          this.logger.info(
            `Processing PAYMENT.CAPTURE.COMPLETED for order: ${orderId}`,
          );
          break;

        case 'CHECKOUT.ORDER.APPROVED':
          // Extract order ID from order approved event
          orderId = payload.resource?.id;
          this.logger.info(
            `Processing CHECKOUT.ORDER.APPROVED for order: ${orderId}`,
          );
          break;

        case 'CHECKOUT.ORDER.COMPLETED':
          // Extract order ID from order completed event
          orderId = payload.resource?.id;
          this.logger.info(
            `Processing CHECKOUT.ORDER.COMPLETED for order: ${orderId}`,
          );
          break;

        default:
          this.logger.warn(`Unhandled webhook event type: ${eventType}`);
          return;
      }

      if (!orderId) {
        this.logger.error('Could not extract order ID from webhook payload');
        return;
      }

      // Find payment by transaction ID (PayPal order ID)
      const payment = await this.paymentsRepository.findOne({
        where: { transactionId: orderId },
        relations: ['bookTour'],
      });

      if (!payment) {
        this.logger.warn(`Payment not found for order ID: ${orderId}`);
        return;
      }

      // Only update if payment is not already successful
      if (payment.status !== PaymentStatus.SUCCES) {
        this.logger.info(
          `Updating payment ${payment.id} status to SUCCESS for order ${orderId}`,
        );

        // Extract payer email from different possible locations in payload
        const payerEmail =
          payload.resource?.payer?.email_address ||
          payload.resource?.payer?.payer_info?.email ||
          null;

        await this.paymentsRepository.update(payment.id, {
          status: PaymentStatus.SUCCES,
          payer_email: payerEmail,
        });

        // Update book tour status to ONGOING
        await this.bookToursService.updateStatusBookTour(
          payment.bookTour.id,
          StatusBookTour.ONGOING,
        );

        this.logger.info(
          `Successfully processed webhook for payment ${payment.id}`,
        );
      } else {
        this.logger.info(
          `Payment ${payment.id} already marked as successful, skipping update`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling webhook: ${error.message}`,
        error.stack,
      );
      // Don't throw error - we don't want to return 500 to PayPal
      // PayPal will retry if we return an error
    }
  }

  findAll() {
    return `This action returns all payments`;
  }

  findOne(id: string) {
    return `This action returns a #${id} payment`;
  }

  update(id: string) {
    return `This action updates a #${id} payment`;
  }

  remove(id: string) {
    return `This action removes a #${id} payment`;
  }
}
