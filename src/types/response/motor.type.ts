import { ResponseModel } from "./response.type";

export class MotorTranslationData {
  language_code: string;
  name_motor: string;
  slug: string;
  description: string;
}

export class VariantData {
  id: string;
  color: string;
}

export class MotorPriceData {
  id: string;
  price_type: string;
  price: number;
}

export class MerekData {
  id: string;
  name_merek: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MerekResponse extends ResponseModel<MerekData> {
  message: string;
  data?: MerekData;
  datas?: MerekData[];
}

export class MotorData {
  id: string;
  engine_cc: number;
  thumbnail: string;
  is_available: boolean;
  merek?: MerekData;
  state?: any; // You can define StateData if needed
  translations?: MotorTranslationData[];
  variants?: VariantData[];
  motor_prices?: MotorPriceData[];
}

export class MotorResponse extends ResponseModel<MotorData> {
  message: string;
  data?: MotorData;
  datas?: MotorData[];
}
