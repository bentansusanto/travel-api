import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Gender } from '../entities/tourist.entity';

export class UpdateBulkTouristItemDto {
  @IsNotEmpty({ message: 'id is required' })
  @IsString({ message: 'id must be string' })
  id: string;

  @IsNotEmpty({ message: 'name is required' })
  @IsString({ message: 'name must be string' })
  name: string;

  @IsNotEmpty({ message: 'gender is required' })
  @IsEnum(Gender, { message: 'gender must be enum' })
  gender: Gender;

  @IsOptional()
  @IsString({ message: 'phone_number must be string' })
  phone_number?: string;

  @IsNotEmpty({ message: 'nationality is required' })
  @IsString({ message: 'nationality must be string' })
  nationality: string;

  @IsNotEmpty({ message: 'passport_number is required' })
  @IsString({ message: 'passport_number must be string' })
  passport_number: string;
}

export class UpdateManyTouristsDto {
  @IsArray({ message: 'tourists must be an array' })
  @ValidateNested({ each: true })
  @Type(() => UpdateBulkTouristItemDto)
  tourists: UpdateBulkTouristItemDto[];
}
