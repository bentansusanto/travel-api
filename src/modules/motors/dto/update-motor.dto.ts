import { PartialType } from '@nestjs/mapped-types';
import { CreateMotorDto } from './create-motor.dto';

export class UpdateMotorDto extends PartialType(CreateMotorDto) {}
