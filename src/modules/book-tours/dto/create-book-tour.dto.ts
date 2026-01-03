import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBookTourDto {
  @IsNotEmpty({ message: 'destination_id is required' })
  @IsString({ message: 'destination_id must be a string' })
  destination_id: string;

  @IsNotEmpty({ message: 'visit_date is required' })
  @IsString({ message: 'visit_date must be a string' })
  visit_date: string;
}

export class UpdateBookTourDto extends PartialType(CreateBookTourDto) {}
