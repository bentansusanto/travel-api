import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailReqDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;
}
