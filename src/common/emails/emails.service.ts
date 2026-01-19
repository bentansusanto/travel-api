import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import {
  EmailType,
  SendMailOptions,
  SendMailOrdersOptions,
} from 'src/types/email.type';

@Injectable()
export class EmailService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: LoggerService,
  ) {}
  private transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  } as SMTPTransport.Options);

  async sendMail(type: EmailType, options: SendMailOptions) {
    const { email, links, subjectMessage } = options;

    let subject = '';
    let htmlContent = '';

    switch (type) {
      case EmailType.VERIFY_ACCOUNT:
        subject = subjectMessage;
        htmlContent = `<div style="font-family: Arial, sans-serif; text-align: center;">
                    <p>${subjectMessage}</p>
                    <a href=${links} style="background:rgba(0, 0, 0, 1); text-color:#ffff; padding: 10px 5px">Verify Account</a>
                    <p>Kode ini berlaku hanya dalam beberapa menit.</p>
                </div>`;
        break;

      case EmailType.RESET_PASSWORD:
        subject = subjectMessage;
        htmlContent = `<div style="font-family: Arial, sans-serif; text-align: center;">
                    <p>${subjectMessage}</p>
                    <p>Reset Password ini berlaku hanya dalam beberapa menit.</p>
                    <a href=${links} style="background:rgb(246, 127, 0); padding: 10px 5px">Reset Password</a>`;
        break;

      default:
        this.logger.error('Invalid email type');
        throw new Error('Invalid email type');
    }

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject,
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.debug(`Email sent to ${email} - Type: ${type}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw new HttpException(
        `Failed to send email: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Send order-related emails (booking confirmation, payment status)
   * Uses switch case to handle different email types
   */
  async sendOrderEmail(type: EmailType, options: SendMailOrdersOptions) {
    let customerSubject = '';
    let customerHtml = '';
    let adminSubject = '';
    let adminHtml = '';

    // Generate email content based on type
    switch (type) {
      case EmailType.SUCCESS_BOOKING:
        customerSubject = `Konfirmasi Pesanan Anda - ${options.orderCode}`;
        customerHtml = this.generateCustomerBookingEmail(options);
        adminSubject = `Pesanan Baru Diterima - ${options.orderCode}`;
        adminHtml = this.generateAdminBookingEmail(options);
        break;

      case EmailType.SUCCESS_PAYMENT:
        customerSubject = `Pembayaran Berhasil - ${options.orderCode}`;
        customerHtml = this.generateCustomerPaymentEmail(options);
        adminSubject = `Status Pembayaran - ${options.orderCode}`;
        adminHtml = this.generateAdminPaymentEmail(options);
        break;

      default:
        this.logger.error(`Invalid order email type: ${type}`);
        throw new Error(`Invalid order email type: ${type}`);
    }

    try {
      // Send email to customer
      await this.sendToCustomer(options.email, customerSubject, customerHtml);

      // Send email to admin
      await this.sendToAdmin(adminSubject, adminHtml);

      this.logger.debug(
        `Order email sent successfully - Type: ${type}, Order: ${options.orderCode}`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to send order email: ${error.message}`);
      throw new HttpException(
        `Failed to send order email: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Send email to customer
   */
  private async sendToCustomer(
    email: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject,
      html,
    };

    await this.transporter.sendMail(mailOptions);
    this.logger.debug(`Email sent to customer: ${email}`);
  }

  /**
   * Send email to admin (owner + admin emails)
   */
  private async sendToAdmin(subject: string, html: string): Promise<void> {
    const ownerEmail = process.env.OWNER_EMAIL;
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: ownerEmail,
      cc: adminEmails.filter(Boolean).join(','),
      subject,
      html,
    };

    await this.transporter.sendMail(mailOptions);
    this.logger.debug(
      `Email sent to admin - Owner: ${ownerEmail}, CC: ${adminEmails.join(', ')}`,
    );
  }

  /**
   * Generate customer booking confirmation email
   */
  private generateCustomerBookingEmail(options: SendMailOrdersOptions): string {
    // Determine currency display
    const currency = options.currency?.toUpperCase() || 'IDR';
    const isPayPal = options.paymentMethod?.toLowerCase().includes('paypal');

    // Format amount display
    let amountDisplay = '';
    if (isPayPal && options.totalAmountUSD && currency !== 'USD') {
      // Show both currencies for PayPal
      amountDisplay = `
        <p><strong>Total: Rp ${options.totalAmount?.toLocaleString('id-ID') || 0}</strong></p>
        <p style="color: #666; font-size: 14px;">≈ USD $ ${options.totalAmountUSD?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}</p>
        ${options.exchangeRate ? `<p style="color: #999; font-size: 12px;">Exchange rate: 1 USD = Rp ${options.exchangeRate.toLocaleString('id-ID')}</p>` : ''}
      `;
    } else if (currency === 'USD') {
      amountDisplay = `<p><strong>Total: $ ${options.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}</strong></p>`;
    } else {
      amountDisplay = `<p><strong>Total: Rp ${options.totalAmount?.toLocaleString('id-ID') || 0}</strong></p>`;
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333;">Konfirmasi Pesanan Anda</h2>
        <p>Hai <strong>${options.email}</strong>,</p>
        <p>Terima kasih telah memesan dengan kami. Pesanan Anda dengan ID <strong>${options.orderCode}</strong> telah kami terima.</p>

        <h3>Detail Pesanan:</h3>
        <div style="background: #f9f9f9; padding: 10px; border-radius: 5px;">
          ${options.orderDetails}
        </div>

        ${amountDisplay}
        <p><strong>Metode Pembayaran:</strong> ${options.paymentMethod}</p>
        <p>Silahkan lanjutkan pembayaran melalui metode pembayaran yang Anda pilih.</p>

        ${options.links ? `<a href="${options.links}" style="display: inline-block; background: rgb(246, 127, 0); color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Lanjutkan Pembayaran</a>` : ''}

        <hr/>
        <p style="font-size: 12px; color: #777;">Email ini dikirim otomatis, mohon tidak membalas.</p>
      </div>
    `;
  }

  /**
   * Generate admin booking notification email
   */
  private generateAdminBookingEmail(options: SendMailOrdersOptions): string {
    // Determine currency display
    const currency = options.currency?.toUpperCase() || 'IDR';
    const isPayPal = options.paymentMethod?.toLowerCase().includes('paypal');

    // Format amount display
    let amountDisplay = '';
    if (isPayPal && options.totalAmountUSD && currency !== 'USD') {
      amountDisplay = `
        <li><strong>Total (IDR):</strong> Rp ${options.totalAmount?.toLocaleString('id-ID') || 0}</li>
        <li><strong>Total (USD):</strong> $ ${options.totalAmountUSD?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}</li>
        ${options.exchangeRate ? `<li><strong>Exchange Rate:</strong> 1 USD = Rp ${options.exchangeRate.toLocaleString('id-ID')}</li>` : ''}
      `;
    } else if (currency === 'USD') {
      amountDisplay = `<li><strong>Total Bayar:</strong> $ ${options.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}</li>`;
    } else {
      amountDisplay = `<li><strong>Total Bayar:</strong> Rp ${options.totalAmount?.toLocaleString('id-ID') || 0}</li>`;
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #d9534f;">Pesanan Baru Diterima</h2>
        <p><strong>Detail Pesanan:</strong></p>
        <ul>
          <li><strong>ID Pesanan:</strong> ${options.orderCode}</li>
          <li><strong>Email Pelanggan:</strong> ${options.email}</li>
          ${amountDisplay}
          <li><strong>Metode Pembayaran:</strong> ${options.paymentMethod}</li>
        </ul>

        <h3>Detail Pemesanan:</h3>
        <div style="background: #f9f9f9; padding: 10px; border-radius: 5px;">
          ${options.orderDetails}
        </div>

        <p style="margin-top: 15px;">Pesanan sedang menunggu pembayaran dari pelanggan.</p>
        <hr/>
        <p style="font-size: 12px; color: #777;">Email ini dikirim otomatis, mohon tidak membalas.</p>
      </div>
    `;
  }

  /**
   * Generate customer payment success email
   */
  private generateCustomerPaymentEmail(options: SendMailOrdersOptions): string {
    // Determine currency display
    const currency = options.currency?.toUpperCase() || 'IDR';
    const isPayPal = options.paymentMethod?.toLowerCase().includes('paypal');

    // Format amount display
    let amountDisplay = '';
    if (isPayPal && options.totalAmountUSD && currency !== 'USD') {
      amountDisplay = `
        <p><strong>Total Dibayar (IDR): Rp ${options.totalAmount?.toLocaleString('id-ID') || 0}</strong></p>
        <p><strong>Dibayar via PayPal (USD): $ ${options.totalAmountUSD?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}</strong></p>
        ${options.exchangeRate ? `<p style="color: #666; font-size: 12px;">Exchange rate: 1 USD = Rp ${options.exchangeRate.toLocaleString('id-ID')}</p>` : ''}
      `;
    } else if (currency === 'USD') {
      amountDisplay = `<p><strong>Total Dibayar: $ ${options.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}</strong></p>`;
    } else {
      amountDisplay = `<p><strong>Total Dibayar: Rp ${options.totalAmount?.toLocaleString('id-ID') || 0}</strong></p>`;
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #28a745;">Pembayaran Berhasil!</h2>
        <p>Hai <strong>${options.email}</strong>,</p>
        <p>Pembayaran Anda untuk pesanan <strong>${options.orderCode}</strong> telah berhasil diproses.</p>

        <h3>Detail Pesanan:</h3>
        <div style="background: #f9f9f9; padding: 10px; border-radius: 5px;">
          ${options.orderDetails}
        </div>

        ${amountDisplay}
        <p style="color: #28a745; font-weight: bold;">Status: Pembayaran Berhasil ✓</p>

        <p>Kami akan segera memproses pesanan Anda. Terima kasih!</p>
        <hr/>
        <p style="font-size: 12px; color: #777;">Email ini dikirim otomatis, mohon tidak membalas.</p>
      </div>
    `;
  }

  /**
   * Generate admin payment notification email
   */
  private generateAdminPaymentEmail(options: SendMailOrdersOptions): string {
    // Determine currency display
    const currency = options.currency?.toUpperCase() || 'IDR';
    const isPayPal = options.paymentMethod?.toLowerCase().includes('paypal');

    // Format amount display
    let amountDisplay = '';
    if (isPayPal && options.totalAmountUSD && currency !== 'USD') {
      amountDisplay = `
        <li><strong>Total (IDR):</strong> Rp ${options.totalAmount?.toLocaleString('id-ID') || 0}</li>
        <li><strong>Dibayar (USD):</strong> $ ${options.totalAmountUSD?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}</li>
        ${options.exchangeRate ? `<li><strong>Exchange Rate:</strong> 1 USD = Rp ${options.exchangeRate.toLocaleString('id-ID')}</li>` : ''}
      `;
    } else if (currency === 'USD') {
      amountDisplay = `<li><strong>Total Dibayar:</strong> $ ${options.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}</li>`;
    } else {
      amountDisplay = `<li><strong>Total Dibayar:</strong> Rp ${options.totalAmount?.toLocaleString('id-ID') || 0}</li>`;
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #28a745;">Pembayaran Diterima</h2>
        <p><strong>Detail Pembayaran:</strong></p>
        <ul>
          <li><strong>ID Pesanan:</strong> ${options.orderCode}</li>
          <li><strong>Email Pelanggan:</strong> ${options.email}</li>
          ${amountDisplay}
          <li><strong>Metode Pembayaran:</strong> ${options.paymentMethod}</li>
        </ul>

        <p style="color: #28a745; font-weight: bold;">Status: Pembayaran Berhasil ✓</p>

        <h3>Detail Pemesanan:</h3>
        <div style="background: #f9f9f9; padding: 10px; border-radius: 5px;">
          ${options.orderDetails}
        </div>
        <hr/>
        <p style="font-size: 12px; color: #777;">Email ini dikirim otomatis, mohon tidak membalas.</p>
      </div>
    `;
  }
}
