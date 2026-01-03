import { PartialType } from "@nestjs/mapped-types";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { Gender } from "../entities/tourist.entity";

export class CreateTouristDto {
  @IsNotEmpty({message: "book_tour_id is required"})
  @IsString({message: "book_tour_id must be string"})
  book_tour_id: string;

  @IsNotEmpty({message: "name is required"})
  @IsString({message: "name must be string"})
  name: string;

  @IsNotEmpty({message: "gender is required"})
  @IsEnum(Gender, {message: "gender must be enum"})
  gender: Gender;

  @IsNotEmpty({message: "phone_number is required"})
  @IsString({message: "phone_number must be string"})
  phone_number: string;

  @IsNotEmpty({message: "nationality is required"})
  @IsString({message: "nationality must be string"})
  nationality: string;

  @IsNotEmpty({message: "passport_number is required"})
  @IsString({message: "passport_number must be string"})
  passport_number: string;
}

export class UpdateTouristDto extends PartialType(CreateTouristDto) {
  @IsNotEmpty({message: "name is required"})
  @IsString({message: "name must be string"})
  name: string;

  @IsNotEmpty({message: "gender is required"})
  @IsEnum(Gender, {message: "gender must be enum"})
  gender: Gender;

  @IsNotEmpty({message: "phone_number is required"})
  @IsString({message: "phone_number must be string"})
  phone_number: string;

  @IsNotEmpty({message: "nationality is required"})
  @IsString({message: "nationality must be string"})
  nationality: string;

  @IsNotEmpty({message: "passport_number is required"})
  @IsString({message: "passport_number must be string"})
  passport_number: string;
}
