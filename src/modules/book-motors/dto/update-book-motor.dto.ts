import { PartialType } from '@nestjs/mapped-types';
import { CreateBookMotorDto } from './create-book-motor.dto';

export class UpdateBookMotorDto extends PartialType(CreateBookMotorDto) {}
