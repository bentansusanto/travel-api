import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { PriceType } from '../entities/motor-price.entity';

export class CreateMotorPriceDto {
  @IsNotEmpty({ message: 'Price type is required' })
  @IsEnum(PriceType, { message: 'Price type must be a valid enum' })
  price_type: PriceType;

  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber({}, { message: 'Price must be a number' })
  price: number;
}

export class UpdateMotorPriceDto extends PartialType(CreateMotorPriceDto) {}
