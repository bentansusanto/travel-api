import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from 'src/modules/tourists/entities/tourist.entity';

class BookMotorItemDto {
  @IsNotEmpty()
  @IsString()
  motor_id: string;

  @IsNotEmpty()
  @IsNumber()
  qty: number;
}

class TouristDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  passport_number: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsNotEmpty()
  @IsString()
  nationality: string;
}

export class CreateBookMotorDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookMotorItemDto)
  items: BookMotorItemDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TouristDto)
  tourists: TouristDto[];

  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @IsNotEmpty()
  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  add_ons?: string[];
}
