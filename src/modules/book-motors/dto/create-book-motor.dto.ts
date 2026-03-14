import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
}
