import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { AddOnCategory } from '../entities/add-on.entity';

export class CreateAddOnDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber({}, { message: 'Price must be a number' })
  price: number;

  @IsNotEmpty({ message: 'Category is required' })
  @IsEnum(AddOnCategory, { message: 'Category must be a valid enum' })
  category: AddOnCategory;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}

export class UpdateAddOnDto extends PartialType(CreateAddOnDto) {}
