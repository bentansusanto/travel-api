import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMotorVariantDto {
  @IsNotEmpty({ message: 'Color is required' })
  @IsString({ message: 'Color must be a string' })
  color: string;
}

export class UpdateMotorVariantDto extends PartialType(CreateMotorVariantDto) {}
