import { PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateMerekDto {
  @IsString()
  @IsNotEmpty()
  name_merek: string;
}

export class UpdateMerekDto extends PartialType(CreateMerekDto) {}
