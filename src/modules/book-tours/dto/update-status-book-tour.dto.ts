import { IsEnum, IsNotEmpty } from 'class-validator';
import { StatusBookTour } from '../entities/book-tour.entity';

export class UpdateStatusBookTourDto {
  @IsNotEmpty({ message: 'status is required' })
  @IsEnum(StatusBookTour, {
    message: 'status must be a valid StatusBookTour value',
  })
  status: StatusBookTour;
}
