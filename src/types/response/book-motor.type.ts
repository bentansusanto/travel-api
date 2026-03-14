import { StatusBookMotor } from 'src/modules/book-motors/entities/book-motor.entity';
import { ResponseModel } from './response.type';

export class BookMotorItemData {
  id: string;
  motor_id: string;
  motor_name: string;
  price: number;
  qty: number;
  subtotal: number;
}

export class BookMotorTouristData {
  id: string;
  name: string;
  passport_number: string;
  phone_number?: string;
}

export class BookMotorData {
  id: string;
  user_id: string;
  start_date: Date;
  end_date: Date;
  total_price: number;
  status: StatusBookMotor;
  items: BookMotorItemData[];
  tourists: BookMotorTouristData[];
  created_at: Date;
  updated_at: Date;
}

export class BookMotorResponse extends ResponseModel<BookMotorData> {
  message: string;
  data?: BookMotorData;
  datas?: BookMotorData[];
}
