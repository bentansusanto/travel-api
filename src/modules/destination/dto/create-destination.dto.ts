import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

// create destination dto
export class CreateDestinationDto {
  @IsNotEmpty({ message: 'State is required' })
  @IsString({ message: 'State must be a string' })
  state_id: string;

  @IsNotEmpty({ message: 'Category Destination is required' })
  @IsString({ message: 'Category Destination must be a string' })
  category_destination_id: string;

  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber({}, { message: 'Price must be a number' })
  price: number;
}

// update destination dto
export class UpdateDestinationDto extends PartialType(CreateDestinationDto) {}
