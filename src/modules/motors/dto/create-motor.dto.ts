import { PartialType } from "@nestjs/mapped-types";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreateMotorTranslationDto } from "./create-motor-translation.dto";
import { CreateMotorVariantDto } from "./create-motor-variant.dto";
import { CreateMotorPriceDto } from "./create-motor-price.dto";

export class CreateMotorDto {
  @IsNumber()
  @IsNotEmpty()
  engine_cc: number;

  @IsString()
  @IsNotEmpty()
  thumbnail: string;

  @IsBoolean()
  @IsNotEmpty()
  is_available: boolean;

  @IsString()
  @IsNotEmpty()
  merek_id: string;

  @IsString()
  @IsNotEmpty()
  state_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMotorTranslationDto)
  @IsNotEmpty()
  translations: CreateMotorTranslationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMotorVariantDto)
  @IsNotEmpty()
  variants: CreateMotorVariantDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMotorPriceDto)
  @IsNotEmpty()
  prices: CreateMotorPriceDto[];
}

export class UpdateMotorDto extends PartialType(CreateMotorDto) {}
