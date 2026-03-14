import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMotorTranslationDto {
  @IsNotEmpty({ message: 'Language code is required' })
  @IsString({ message: 'Language code must be a string' })
  language_code: string;

  @IsNotEmpty({ message: 'Motor name is required' })
  @IsString({ message: 'Motor name must be a string' })
  name_motor: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  description: string;
}

export class UpdateMotorTranslationDto extends PartialType(CreateMotorTranslationDto) {}
