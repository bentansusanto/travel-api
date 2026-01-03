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
import { EmailType, SendMailOptions } from 'src/types/email.type';

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
    const { email, otpCode, links, subjectMessage } = options;

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
}
