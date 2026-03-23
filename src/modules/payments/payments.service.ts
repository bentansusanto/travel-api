import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { EmailService } from 'src/common/emails/emails.service';
import { EmailType } from 'src/types/email.type';
import { PaymentResponse } from 'src/types/response/payment.type';
import { Repository } from 'typeorm';
import { Logger } from 'winston';
import { BookToursService } from '../book-tours/book-tours.service';
import { BookMotorsService } from '../book-motors/book-motors.service';
import { StatusBookTour } from '../book-tours/entities/book-tour.entity';
import { StatusBookMotor } from '../book-motors/entities/book-motor.entity';
import { SalesService } from '../sales/sales.service';
import { TouristsService } from '../tourists/tourists.service';
import { UsersService } from '../users/users.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from './entities/payment.entity';
import { ServiceType } from './entities/service-type.enum';
import { PaypalService } from './paypal.service';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    private readonly bookToursService: BookToursService,
    private readonly bookMotorsService: BookMotorsService,
    private readonly usersService: UsersService,
    private readonly paypalService: PaypalService,
    private readonly touristService: TouristsService,
    private readonly salesService: SalesService,
    private readonly emailService: EmailService,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
  ) {}
  // Cache for exchange rates (to avoid excessive API calls)
  private exchangeRateCache: {
    rate: number;
    timestamp: number;
    fromCurrency: string;
    toCurrency: string;
  } | null = null;
  private readonly CACHE_DURATION = 3600000; // 1 hour in milliseconds

  /**
   * Fetch exchange rate from external API
   * Using ExchangeRate-API (free tier: 1500 requests/month)
   * Alternative: https://api.exchangerate-api.com/v4/latest/USD
   */
  private async fetchExchangeRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    try {
      const normalizedFrom = fromCurrency.toUpperCase();
      const normalizedTo = toCurrency.toUpperCase();

      // Check cache first
      if (
        this.exchangeRateCache &&
        this.exchangeRateCache.fromCurrency === normalizedFrom &&
        this.exchangeRateCache.toCurrency === normalizedTo &&
        Date.now() - this.exchangeRateCache.timestamp < this.CACHE_DURATION
      ) {
        this.logger.debug(
          `Using cached exchange rate: 1 ${normalizedFrom} = ${this.exchangeRateCache.rate} ${normalizedTo}`,
        );
        return this.exchangeRateCache.rate;
      }

      // Fetch from API
      this.logger.debug(
        `Fetching exchange rate from API: ${normalizedFrom} to ${normalizedTo}`,
      );

      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${normalizedFrom}`,
      );

      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.statusText}`);
      }

      const data = await response.json();
      const rate = data.rates[normalizedTo];

      if (!rate) {
        throw new Error(
          `Exchange rate not found for ${normalizedFrom} to ${normalizedTo}`,
        );
      }

      // Cache the result
      this.exchangeRateCache = {
        rate,
        timestamp: Date.now(),
        fromCurrency: normalizedFrom,
        toCurrency: normalizedTo,
      };

      this.logger.debug(
        `Fetched exchange rate: 1 ${normalizedFrom} = ${rate} ${normalizedTo}`,
      );

      return rate;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch exchange rate: ${error.message}. Using fallback rate.`,
      );
      // Fallback to approximate rate if API fails
      if (
        fromCurrency.toUpperCase() === 'IDR' &&
        toCurrency.toUpperCase() === 'USD'
      ) {
        return 1 / 15000; // Approximate fallback
      } else if (
        fromCurrency.toUpperCase() === 'USD' &&
        toCurrency.toUpperCase() === 'IDR'
      ) {
        return 15000; // Approximate fallback
      }
      return 1; // Same currency fallback
    }
  }

  /**
   * Convert amount from one currency to another using live exchange rates
   */
  private async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    const normalizedFrom = fromCurrency?.toUpperCase();
    const normalizedTo = toCurrency?.toUpperCase();

    // If same currency, no conversion needed
    if (normalizedFrom === normalizedTo) {
      return amount;
    }

    // Get exchange rate
    const rate = await this.fetchExchangeRate(normalizedFrom, normalizedTo);
    const convertedAmount = amount * rate;

    this.logger.debug(
      `Converted ${amount} ${normalizedFrom} to ${convertedAmount.toFixed(2)} ${normalizedTo} (rate: ${rate})`,
    );

    return convertedAmount;
  }

  // Helper method to convert currency (backward compatibility)
  private async convertToUSD(
    amount: number,
    fromCurrency: string,
  ): Promise<number> {
    return this.convertCurrency(amount, fromCurrency, 'USD');
  }

  private async payPalOrder(
    orderId: string,
    amount: number,
    currency: string = 'IDR',
    exchangeRate?: number, // Optional exchange rate from frontend
  ) {
    // Dapatkan token akses dari PayPal
    const accessToken = await this.paypalService.authPaypal();

    // Log currency conversion

    // Use exchange rate from frontend if provided, otherwise use convertToUSD
    let convertedAmount: number;
    if (exchangeRate && currency.toUpperCase() === 'IDR') {
      convertedAmount = amount * exchangeRate;
    } else {
      convertedAmount = await this.convertToUSD(amount, currency);
    }

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
                value: convertedAmount.toFixed(2),
              },
              description: `Order ID: ${orderId}`,
            },
          ],
          application_context: {
            return_url: `${process.env.FRONTEND_URL || 'http://localhost:3200'}/en/payments/success/`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3200'}/en/payments/`,
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            brand_name: 'PacificTravelindo',
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

  // generate ordercode
  private async generateOrderCode(): Promise<string> {
    try {
      const randomCode = randomInt(1000, 9999).toString();
      const existingOrder = await this.paymentsRepository.findOne({
        where: { invoice_code: randomCode },
      });

      if (existingOrder) {
        return this.generateOrderCode();
      }

      return randomCode;
    } catch (error: any) {
      this.logger.error(error.message);
      throw new Error(error.message);
    }
  }

  // Create payment
  async createPayment(
    user_id: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponse> {
    try {
      const { book_tour_id, book_motor_id, currency, payment_method, exchange_rate } = createPaymentDto;

      if (!book_tour_id && !book_motor_id) {
        throw new HttpException('Booking ID is required', HttpStatus.BAD_REQUEST);
      }

      // 1. Validasi User
      const findUser = await this.usersService.findById(user_id);
      if (!findUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      let totalAmount = 0;
      let serviceType: ServiceType;
      let invoicePrefix: string;
      let bookingData: any;

      // 2. Load Booking Data & Calculate Amount
      if (book_tour_id) {
        const [findBookTour, findTourist] = await Promise.all([
          this.bookToursService.findBookTourId(book_tour_id, user_id),
          this.touristService.findTouristByBookTour(book_tour_id),
        ]);

        if (!findBookTour || findBookTour.data.user_id !== user_id) {
          throw new HttpException('Book tour not found', HttpStatus.NOT_FOUND);
        }

        if (
          findBookTour.data.status !== StatusBookTour.PENDING &&
          findBookTour.data.status !== StatusBookTour.DRAFT
        ) {
          throw new HttpException('Book tour is already paid or cancelled', HttpStatus.BAD_REQUEST);
        }

        if (!findTourist) {
          throw new HttpException('Tourist not found', HttpStatus.NOT_FOUND);
        }

        totalAmount = findBookTour.data.subtotal * findTourist.data.tourists.length;
        serviceType = ServiceType.TOUR;
        invoicePrefix = 'TOUR';
        bookingData = findBookTour.data;
      } else {
        const findBookMotor = await this.bookMotorsService.findOne(book_motor_id);

        if (!findBookMotor || findBookMotor.data.user_id !== user_id) {
          throw new HttpException('Book motor not found', HttpStatus.NOT_FOUND);
        }

        if (findBookMotor.data.status !== StatusBookMotor.PENDING) {
          throw new HttpException('Book motor is already paid or cancelled', HttpStatus.BAD_REQUEST);
        }

        totalAmount = findBookMotor.data.total_price;
        serviceType = ServiceType.RENT_MOTOR;
        invoicePrefix = 'RENT';
        bookingData = findBookMotor.data;
      }

      // 3. Generate Invoice Code
      const invoiceCode = `${invoicePrefix}-${await this.generateOrderCode()}`;

      // 4. Create Payment Entity
      const newPayment = this.paymentsRepository.create({
        user: { id: user_id },
        bookTour: book_tour_id ? { id: book_tour_id } : null,
        bookMotor: book_motor_id ? { id: book_motor_id } : null,
        currency: currency,
        payment_method: payment_method,
        amount: totalAmount,
        invoice_code: invoiceCode,
        service_type: serviceType as ServiceType,
        total_tourists: book_tour_id ? bookingData.book_tour_items?.length : bookingData.book_motor_items?.length, 
      });
      await this.paymentsRepository.save(newPayment);

      // 5. Update Booking Status to PENDING (if it was DRAFT)
      if (book_tour_id) {
        await this.bookToursService.updateStatusBookTour(book_tour_id, StatusBookTour.PENDING);
      }
      // Motor is already PENDING by default in create

      // 6. PayPal Logic
      let paymentPaypal: any;
      if (newPayment.payment_method === PaymentMethod.PAYPAL) {
        paymentPaypal = await this.payPalOrder(
          newPayment.id,
          newPayment.amount,
          newPayment.currency,
          exchange_rate,
        );
        await this.paymentsRepository.update(newPayment.id, {
          redirect_url: paymentPaypal.approval_url,
          transactionId: paymentPaypal.paypal_order_id,
        });
      }

      // 7. Email Logic (Simplified/Generic) - Optimized: Fire and Forget
      (async () => {
        try {
          let totalAmountUSD: number | undefined;
          let rate: number | undefined;

          if (payment_method === PaymentMethod.PAYPAL && currency?.toUpperCase() !== 'USD') {
            if (exchange_rate) {
              rate = 1 / exchange_rate;
              totalAmountUSD = totalAmount * exchange_rate;
            } else {
              totalAmountUSD = await this.convertToUSD(totalAmount, currency);
            }
          }

          // Generate dynamic details based on service type
          const orderDetails = await this.generateOrderDetailsHTML(
            book_tour_id ? bookingData.book_tour_items : bookingData.book_motor_items,
            serviceType as ServiceType,
            currency,
            exchange_rate,
            bookingData.booking_add_ons,
          );

          await this.emailService.sendOrderEmail(EmailType.SUCCESS_BOOKING, {
            email: findUser.data.email,
            orderCode: newPayment.invoice_code,
            orderDetails,
            totalAmount: totalAmount,
            totalAmountUSD,
            currency: newPayment.currency,
            exchangeRate: rate,
            paymentMethod: newPayment.payment_method,
            links: paymentPaypal?.approval_url || undefined,
          });
        } catch (emailError) {
          this.logger.error(`Failed to send booking email: ${emailError.message}`);
        }
      })();

      return {
        message: 'Success creating payment',
        data: {
          id: newPayment.id,
          user_id: newPayment.user.id,
          invoice_code: newPayment.invoice_code,
          book_tour_id: newPayment.bookTour?.id,
          book_motor_id: newPayment.bookMotor?.id,
          amount: newPayment.amount,
          currency: newPayment.currency,
          service_type: newPayment.service_type,
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
        relations: ['user', 'bookTour', 'bookMotor'],
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

      // update booking status to ONGOING/CONFIRMED
      if (payment.service_type === ServiceType.TOUR && payment.bookTour) {
        await this.bookToursService.updateStatusBookTour(
          payment.bookTour.id,
          StatusBookTour.ONGOING,
        );
      } else if (payment.service_type === ServiceType.RENT_MOTOR && payment.bookMotor) {
        // For motor, we might use COMPLETED or CONFIRMED? Usually CONFIRMED after payment.
        // Looking at StatusBookMotor: PENDING, CONFIRMED, ONGOING, COMPLETED, CANCELLED.
        await this.bookMotorsService.updateStatus(
          payment.bookMotor.id,
          StatusBookMotor.ONGOING,
        );
      }

      // Create sales record
      await this.salesService.createSaleFromPayment({
        payment_id: payment.id,
        book_tour_id: payment.bookTour?.id,
        book_motor_id: payment.bookMotor?.id,
        amount: payment.amount,
        currency: payment.currency,
        service_type: payment.service_type,
      });

      // Send payment success email
      try {
        let bookingDetails: any;
        if (payment.service_type === ServiceType.TOUR && payment.bookTour) {
          bookingDetails = await this.bookToursService.findBookTourId(
            payment.bookTour.id,
            payment.user.id,
          );
        } else if (payment.service_type === ServiceType.RENT_MOTOR && payment.bookMotor) {
          bookingDetails = await this.bookMotorsService.findOne(payment.bookMotor.id);
        }

        // Calculate USD amount if PayPal
        let totalAmountUSD: number | undefined;
        let exchangeRate: number | undefined;

        if (
          payment.payment_method === PaymentMethod.PAYPAL &&
          payment.currency?.toUpperCase() !== 'USD'
        ) {
          totalAmountUSD = await this.convertToUSD(
            payment.amount,
            payment.currency,
          );
          // Calculate exchange rate from amounts
          if (totalAmountUSD && totalAmountUSD > 0) {
            exchangeRate = payment.amount / totalAmountUSD; // IDR per USD
          }
        }

        const orderDetails = await this.generateOrderDetailsHTML(
          payment.service_type === ServiceType.TOUR ? bookingDetails.data.book_tour_items : bookingDetails.data.book_motor_items,
          payment.service_type,
          payment.currency,
          exchangeRate ? 1 / exchangeRate : undefined, // Convert to USD rate
          bookingDetails.data.booking_add_ons,
        );

        // Fire and forget email sending
        (async () => {
          try {
            await this.emailService.sendOrderEmail(EmailType.SUCCESS_PAYMENT, {
              email: payment.user.email,
              orderCode: payment.invoice_code,
              orderDetails,
              totalAmount: payment.amount,
              totalAmountUSD,
              currency: payment.currency,
              exchangeRate,
              paymentMethod: payment.payment_method,
            });

            this.logger.debug(
              `Payment success email sent for order: ${payment.invoice_code}`,
            );
          } catch (emailError: any) {
            this.logger.error(
              `Failed to send payment success email: ${emailError.message}`,
            );
          }
        })();
      } catch (emailError: any) {
        this.logger.error(
          `Failed to prepare payment success email: ${emailError.message}`,
        );
      }

      return {
        message: 'Success capturing payment',
        data: {
          id: payment.id,
          user_id: payment.user.id,
          invoice_code: payment.invoice_code,
          book_tour_id: payment.bookTour?.id,
          book_motor_id: payment.bookMotor?.id,
          amount: payment.amount,
          currency: payment.currency,
          service_type: payment.service_type,
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

  // handle webhook
  async handleWebhook(payload: any): Promise<PaymentResponse | any> {
    try {
      const eventType = payload.event_type;
      this.logger.debug(`Received PayPal Webhook: ${eventType}`);
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
          this.logger.debug(
            `Processing PAYMENT.CAPTURE.COMPLETED for order: ${orderId}`,
          );
          break;

        case 'CHECKOUT.ORDER.APPROVED':
          // Extract order ID from order approved event
          orderId = payload.resource?.id;
          this.logger.debug(
            `Processing CHECKOUT.ORDER.APPROVED for order: ${orderId}`,
          );
          break;

        case 'CHECKOUT.ORDER.COMPLETED':
          // Extract order ID from order completed event
          orderId = payload.resource?.id;
          this.logger.debug(
            `Processing CHECKOUT.ORDER.COMPLETED for order: ${orderId}`,
          );
          break;

        default:
          this.logger.warn(`Unhandled webhook event type: ${eventType}`);
          return { message: 'Webhook event ignored', data: null };
      }

      if (!orderId) {
        this.logger.error('Could not extract order ID from webhook payload');
        return { message: 'Order ID not found in webhook', data: null };
      }

      // Find payment by transaction ID (PayPal order ID)
      const payment = await this.paymentsRepository.findOne({
        where: { transactionId: orderId },
        relations: ['bookTour', 'bookMotor', 'user'],
      });

      if (!payment) {
        this.logger.warn(`Payment not found for order ID: ${orderId}`);
        return { message: 'Payment not found', data: null };
      }

      // Only update if payment is not already successful
      if (payment.status !== PaymentStatus.SUCCES) {
        this.logger.debug(
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

        // Update booking status
        if (payment.service_type === ServiceType.TOUR && payment.bookTour) {
          await this.bookToursService.updateStatusBookTour(
            payment.bookTour.id,
            StatusBookTour.ONGOING,
          );
        } else if (payment.service_type === ServiceType.RENT_MOTOR && payment.bookMotor) {
          await this.bookMotorsService.updateStatus(
            payment.bookMotor.id,
            StatusBookMotor.ONGOING,
          );
        }

        // Create sales record
        await this.salesService.createSaleFromPayment({
          id: payment.id,
          book_tour_id: payment.bookTour?.id,
          book_motor_id: payment.bookMotor?.id,
          amount: payment.amount,
          currency: payment.currency,
          payment_method: payment.payment_method,
          service_type: payment.service_type,
        });

        // Send payment success email via webhook
        try {
          let bookingDetails: any;
          if (payment.service_type === ServiceType.TOUR && payment.bookTour) {
            bookingDetails = await this.bookToursService.findBookTourId(
              payment.bookTour.id,
              payment.user.id,
            );
          } else if (payment.service_type === ServiceType.RENT_MOTOR && payment.bookMotor) {
            bookingDetails = await this.bookMotorsService.findOne(payment.bookMotor.id);
          }

          // Calculate USD amount if PayPal
          let totalAmountUSD: number | undefined;
          let exchangeRate: number | undefined;

          if (
            payment.payment_method === PaymentMethod.PAYPAL &&
            payment.currency?.toUpperCase() !== 'USD'
          ) {
            totalAmountUSD = await this.convertToUSD(
              payment.amount,
              payment.currency,
            );
            // Calculate exchange rate from amounts
            if (totalAmountUSD && totalAmountUSD > 0) {
              exchangeRate = payment.amount / totalAmountUSD; // IDR per USD
            }
          }

          const orderDetails = await this.generateOrderDetailsHTML(
            payment.service_type === ServiceType.TOUR ? bookingDetails.data.book_tour_items : bookingDetails.data.book_motor_items,
            payment.service_type,
            payment.currency,
            exchangeRate ? 1 / exchangeRate : undefined, // Convert to USD rate
            bookingDetails.data.booking_add_ons,
          );

          // Fire and forget email sending via webhook
          (async () => {
            try {
              await this.emailService.sendOrderEmail(EmailType.SUCCESS_PAYMENT, {
                email: payment.user.email,
                orderCode: payment.invoice_code,
                orderDetails,
                totalAmount: payment.amount,
                totalAmountUSD,
                currency: payment.currency,
                exchangeRate,
                paymentMethod: payment.payment_method,
              });

              this.logger.debug(
                `Payment success email sent via webhook for order: ${payment.invoice_code}`,
              );
            } catch (emailError: any) {
              this.logger.error(
                `Failed to send payment success email via webhook: ${emailError.message}`,
              );
            }
          })();
        } catch (emailError: any) {
          this.logger.error(
            `Failed to prepare payment success email via webhook: ${emailError.message}`,
          );
        }

        this.logger.debug(
          `Successfully processed webhook for payment ${payment.id}`,
        );

        return {
          message: 'Webhook processed successfully',
          data: {
            id: payment.id,
            user_id: payment.user?.id || '',
            book_tour_id: payment.bookTour.id,
            amount: payment.amount,
            currency: payment.currency,
            status: PaymentStatus.SUCCES,
            payment_method: payment.payment_method,
            payer_email: payerEmail,
            transaction_id: orderId,
            created_at: payment.created_at,
            updated_at: new Date(),
          },
        };
      } else {
        this.logger.debug(
          `Payment ${payment.id} already marked as successful, skipping update`,
        );
        return {
          message: 'Payment already processed',
          data: {
            id: payment.id,
            user_id: payment.user?.id || '',
            book_tour_id: payment.bookTour.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            payment_method: payment.payment_method,
            payer_email: payment.payer_email,
            transaction_id: orderId,
            created_at: payment.created_at,
            updated_at: payment.updated_at,
          },
        };
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

  // find all payments
  async findAllPayments(userId: string): Promise<PaymentResponse> {
    try {
      this.logger.debug(`Attempting to find all payments for user: ${userId}`);
      const payments = await this.paymentsRepository.find({
        where: { user: { id: userId } },
        relations: ['bookTour', 'bookMotor', 'user'],
      });

      this.logger.debug(`Found ${payments?.length || 0} payments in database`);
      if (payments?.length > 0) {
        this.logger.debug(
          `First payment sample: ${JSON.stringify(payments[0])}`,
        );
      }

      if (!payments || payments.length === 0) {
        this.logger.warn('No payments found for this user/system');
        // Return empty array instead of throwing 404 to avoid frontend error state
        return {
          message: 'No payments found',
          datas: [],
        };
      }

      this.logger.debug('Successfully retrieved and mapped payments');

      return {
        message: 'Success find all payments',
        datas: payments.map((payment) => ({
          id: payment.id,
          user_id: payment.user?.id || '',
          invoice_code: payment.invoice_code,
          book_tour_id: payment.bookTour?.id || '',
          book_motor_id: payment.bookMotor?.id || '',
          total_tourists: payment.total_tourists,
          amount: payment.amount,
          currency: payment.currency,
          service_type: payment.service_type,
          transaction_id: payment.transactionId,
          payment_method: payment.payment_method,
          payer_email: payment.payer_email,
          redirect_url: payment.redirect_url,
          status: payment.status,
          created_at: payment.created_at,
          updated_at: payment.updated_at,
        })),
      };
    } catch (error) {
      this.logger.error(`Error find all payment: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // find one payment
  async findOnePayment(id: string): Promise<PaymentResponse> {
    try {
      const payment = await this.paymentsRepository.findOne({
        where: { id },
        relations: [
          'user',
          'bookTour',
          'bookTour.book_tour_items',
          'bookTour.book_tour_items.destination',
          'bookTour.book_tour_items.destination.translations',
          'bookTour.book_tour_items.destination.state',
          'bookTour.book_tour_items.destination.state.country',
          'bookTour.tourists',
          'bookTour.country',
          'bookMotor',
          'bookMotor.book_motor_items',
          'bookMotor.book_motor_items.motor',
          'bookMotor.book_motor_items.motor.translations',
        ],
      });

      if (!payment) {
        this.logger.warn(`Payment not found for id: ${id}`);
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }

      this.logger.debug(`Success find payment for id: ${id}`);

      return {
        message: 'Success find payment',
        data: {
          id: payment.id,
          user_id: payment.user?.id,
          user: payment.user
            ? {
                id: payment.user.id,
                name: payment.user.name,
                email: payment.user.email,
              }
            : null,
          invoice_code: payment.invoice_code,
          book_tour_id: payment.bookTour?.id,
          book_motor_id: payment.bookMotor?.id,
          book_tour: payment.bookTour
            ? {
                id: payment.bookTour.id,
                subtotal: payment.bookTour.subtotal,
                status: payment.bookTour.status,
                country: payment.bookTour.country
                  ? {
                      id: payment.bookTour.country.id,
                      name: payment.bookTour.country.name,
                    }
                  : null,
                book_tour_items: payment.bookTour.book_tour_items
                  ? payment.bookTour.book_tour_items.map((item) => {
                      // Get Indonesian translation (default to first translation if not found)
                      const translation =
                        item.destination?.translations?.find(
                          (t) => t.language_code === 'id',
                        ) || item.destination?.translations?.[0];

                      return {
                        id: item.id,
                        visit_date: item.visit_date,
                        destination: item.destination
                          ? {
                              id: item.destination.id,
                              price: item.destination.price,
                              name: translation?.name || '',
                              description: translation?.description || '',
                              detail_tour: translation?.detail_tour || [],
                              thumbnail: translation?.thumbnail || '',
                              location: item.destination.state
                                ? `${item.destination.state.name}, ${item.destination.state.country?.name || ''}`
                                : '',
                            }
                          : null,
                      };
                    })
                  : [],
                tourists: payment.bookTour.tourists
                  ? payment.bookTour.tourists.map((tourist) => ({
                      id: tourist.id,
                      name: tourist.name,
                      gender: tourist.gender,
                      phone_number: tourist.phone_number,
                      nationality: tourist.nationality,
                      passport_number: tourist.passport_number,
                    }))
                  : [],
              }
            : null,
          book_motor: payment.bookMotor
            ? {
                id: payment.bookMotor.id,
                status: payment.bookMotor.status,
                // Add items if needed in future
              }
            : null,
          total_tourists: payment.total_tourists,
          amount: payment.amount,
          currency: payment.currency,
          service_type: payment.service_type,
          transaction_id: payment.transactionId,
          payment_method: payment.payment_method,
          payer_email: payment.payer_email,
          redirect_url: payment.redirect_url,
          status: payment.status,
          created_at: payment.created_at,
          updated_at: payment.updated_at,
        },
      };
    } catch (error) {
      this.logger.error(`Error find payment for id: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // find all payment users
  async finAllPaymentUser(): Promise<PaymentResponse> {
    try {
      const payments = await this.paymentsRepository.find({
        relations: ['user', 'bookTour', 'bookMotor', 'bookTour.book_tour_items', 'bookMotor.book_motor_items'],
      });

      if (!payments || payments.length === 0) {
        this.logger.warn('No payments found for this user/system');
        return {
          message: 'No payments found',
          datas: [],
        };
      }

      this.logger.debug('Successfully retrieved and mapped payments');

      return {
        message: 'Success find all payment users',
        datas: payments.map((payment) => ({
          id: payment.id,
          user_id: payment.user?.id,
          user: payment.user
            ? {
                id: payment.user.id,
                name: payment.user.name,
                email: payment.user.email,
              }
            : null,
          invoice_code: payment.invoice_code,
          book_tour_id: payment.bookTour?.id,
          book_motor_id: payment.bookMotor?.id,
          book_tour: payment.bookTour
            ? {
                id: payment.bookTour.id,
                book_tour_items: payment.bookTour.book_tour_items || [],
              }
            : null,
          book_motor: payment.bookMotor
            ? {
                id: payment.bookMotor.id,
                book_motor_items: payment.bookMotor.book_motor_items || [],
              }
            : null,
          total_tourists: payment.total_tourists,
          amount: payment.amount,
          currency: payment.currency,
          service_type: payment.service_type,
          transaction_id: payment.transactionId,
          payment_method: payment.payment_method,
          payer_email: payment.payer_email,
          redirect_url: payment.redirect_url,
          status: payment.status,
          created_at: payment.created_at,
          updated_at: payment.updated_at,
        })),
      };
    } catch (error) {
      this.logger.error(`Error find all payment user: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Cancel a payment
   * - Only pending/draft payments can be cancelled
   * - Only the user who created the payment can cancel it
   * - Updates payment status to CANCELLED
   * - Resets book tour status to DRAFT
   * - Optionally cancels PayPal transaction if applicable
   */
  async cancelPayment(userId: string, id: string): Promise<PaymentResponse> {
    try {
      // Find payment with relations
      const payment = await this.paymentsRepository.findOne({
        where: { id },
        relations: ['user', 'bookTour', 'bookMotor'],
      });

      if (!payment) {
        this.logger.error(`Payment not found: ${id}`);
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }

      // Authorization: Only the user who created the payment can cancel it
      if (payment.user.id !== userId) {
        this.logger.error(
          `Unauthorized cancel attempt: User ${userId} tried to cancel payment ${id} owned by ${payment.user.id}`,
        );
        throw new HttpException(
          'You are not authorized to cancel this payment',
          HttpStatus.FORBIDDEN,
        );
      }

      // Check if payment can be cancelled
      if (payment.status === PaymentStatus.SUCCES) {
        this.logger.error(
          `Cannot cancel completed payment: ${id}. Status: ${payment.status}`,
        );
        throw new HttpException(
          'Cannot cancel a completed payment. Please request a refund instead.',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (payment.status === PaymentStatus.CANCELLED) {
        this.logger.warn(`Payment already cancelled: ${id}`);
        throw new HttpException(
          'Payment is already cancelled',
          HttpStatus.BAD_REQUEST,
        );
      }

      // If PayPal payment is in progress, attempt to void/cancel the order
      if (
        payment.payment_method === PaymentMethod.PAYPAL &&
        payment.transactionId &&
        payment.status === PaymentStatus.PENDING
      ) {
        try {
          // Note: PayPal orders are automatically voided after 3 hours if not captured
          // We just log this for tracking purposes
          this.logger.debug(
            `PayPal order ${payment.transactionId} will be auto-voided if not captured`,
          );
          // Optionally, you can implement explicit void via PayPal API here
          // await this.paypalService.voidOrder(payment.transactionId);
        } catch (paypalError: any) {
          this.logger.warn(
            `Failed to void PayPal order: ${paypalError.message}`,
          );
          // Continue with cancellation even if PayPal void fails
        }
      }

      // Update payment status to CANCELLED
      await this.paymentsRepository.update(id, {
        status: PaymentStatus.CANCELLED,
        redirect_url: null, // Clear redirect URL
      });

      // Reset book status to DRAFT so user can try again
      if (payment.service_type === ServiceType.TOUR && payment.bookTour) {
        await this.bookToursService.updateStatusBookTour(
          payment.bookTour.id,
          StatusBookTour.DRAFT,
        );
      } else if (payment.service_type === ServiceType.RENT_MOTOR && payment.bookMotor) {
        await this.bookMotorsService.updateStatus(
          payment.bookMotor.id,
          StatusBookMotor.PENDING, // Or keep as PENDING for motor?
        );
      }

      this.logger.debug(
        `Payment cancelled successfully: ${id} by user ${userId}`,
      );

      return {
        message: 'Payment cancelled successfully',
        data: {
          id: payment.id,
          user_id: payment.user?.id || '',
          invoice_code: payment.invoice_code,
          book_tour_id: payment.bookTour?.id || '',
          amount: payment.amount,
          currency: payment.currency,
          service_type: payment.service_type,
          status: PaymentStatus.CANCELLED,
          payment_method: payment.payment_method,
          transaction_id: payment.transactionId,
          created_at: payment.created_at,
          updated_at: new Date(),
        },
      };
    } catch (error) {
      this.logger.error(`Error cancel payment: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  remove(id: string) {
    return `This action removes a #${id} payment`;
  }

  /**
   * Generate HTML for order details email
   * @param bookTourItems - Array of booking items
   * @param currency - Currency code (USD, IDR, etc)
   * @param exchangeRate - Exchange rate for conversion (optional)
   */
  private async generateOrderDetailsHTML(
    items: any[],
    serviceType: ServiceType,
    currency?: string,
    exchangeRate?: number,
    addOns: any[] = [],
  ): Promise<string> {
    if (!items || items.length === 0) {
      return `<p>No ${serviceType === ServiceType.TOUR ? 'tour' : 'motor'} items</p>`;
    }

    const normalizedCurrency = currency?.toUpperCase() || 'IDR';
    const isUSD = normalizedCurrency === 'USD';

    const itemsHTML = await Promise.all(
      items.map(async (item: any, index: number) => {
        if (serviceType === ServiceType.TOUR) {
          const translation =
            item.destination?.translations?.find(
              (t: any) => t.language_code === 'id',
            ) || item.destination?.translations?.[0];

          const name = translation?.name || 'Unknown Destination';
          const priceIDR = item.destination?.price || 0;
          const location = item.destination?.location || 'Unknown Location';
          const visitDate = item.visit_date || 'Not specified';

          let priceDisplay = '';
          if (isUSD) {
            const priceUSD = exchangeRate
              ? priceIDR * exchangeRate
              : await this.convertToUSD(priceIDR, 'IDR');
            priceDisplay = `💰 $ ${priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          } else {
            priceDisplay = `💰 Rp ${priceIDR.toLocaleString('id-ID')}`;
          }

          return `
            <div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #f67f00;">
              <p style="margin: 5px 0;"><strong>${index + 1}. ${name}</strong></p>
              <p style="margin: 5px 0; color: #666;">📍 ${location}</p>
              <p style="margin: 5px 0; color: #666;">📅 Visit Date: ${visitDate}</p>
              <p style="margin: 5px 0; color: #f67f00; font-weight: bold;">${priceDisplay}</p>
            </div>
          `;
        } else {
          // MOTOR RENTAL
          const motorName = item.motor_name || item.motor?.translations?.[0]?.name_motor || 'Motor Rental';
          const priceIDR = item.price || 0;
          const quantity = item.qty || item.quantity || 1;

          let priceDisplay = '';
          if (isUSD) {
            const priceUSD = exchangeRate
              ? priceIDR * exchangeRate
              : await this.convertToUSD(priceIDR, 'IDR');
            priceDisplay = `💰 $ ${priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          } else {
            priceDisplay = `💰 Rp ${priceIDR.toLocaleString('id-ID')}`;
          }

          return `
            <div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #00a8ff;">
              <p style="margin: 5px 0;"><strong>${index + 1}. ${motorName}</strong></p>
              <p style="margin: 5px 0; color: #666;">🔢 Quantity: ${quantity}</p>
              <p style="margin: 5px 0; color: #00a8ff; font-weight: bold;">${priceDisplay}</p>
            </div>
          `;
        }
      }),
    );

    // Add-ons Section
    let addOnsHTML = '';
    if (addOns && addOns.length > 0) {
      addOnsHTML = `
        <div style="margin-top: 20px; border-top: 1px dashed #ddd; pt: 10px;">
          <h4 style="margin-bottom: 10px; color: #333;">Add-ons:</h4>
          ${await Promise.all(
            addOns.map(async (addOn: any) => {
              const priceIDR = addOn.price || 0;
              let priceDisplay = '';
              if (isUSD) {
                const priceUSD = exchangeRate
                  ? priceIDR * exchangeRate
                  : await this.convertToUSD(priceIDR, 'IDR');
                priceDisplay = `$ ${priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              } else {
                priceDisplay = `Rp ${priceIDR.toLocaleString('id-ID')}`;
              }
              return `<p style="margin: 3px 0; font-size: 14px;">• ${addOn.name}: <span style="color: #666;">${priceDisplay}</span></p>`;
            }),
          ).then((parts) => parts.join(''))}
        </div>
      `;
    }

    return itemsHTML.join('') + addOnsHTML;
  }
}
