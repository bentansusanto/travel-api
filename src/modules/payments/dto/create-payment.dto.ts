import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsNotEmpty({ message: 'Book tour id is required' })
  @IsString({ message: 'Book tour id must be a string' })
  book_tour_id: string;

  @IsNotEmpty({ message: 'Payment method is required' })
  @IsEnum(PaymentMethod, { message: 'Payment method must be a string' })
  payment_method: PaymentMethod;

  @IsNotEmpty({ message: 'Currency is required' })
  @IsString({ message: 'Currency must be a string' })
  currency: string;
}
