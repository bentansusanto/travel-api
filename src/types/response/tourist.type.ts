import { ResponseModel } from './response.type';

export class TouristData {
  id: string;
  name: string;
  gender: string;
  phone_number: string;
  nationality: string;
  passport_number: string;
}

export class SingleTouristData {
  id: string;
  book_tour_id: string;
  name: string;
  gender: string;
  phone_number: string;
  nationality: string;
  passport_number: string;
}

export class TouristResponseBulk {
  book_tour_id: string;
  tourists: TouristData[];
}

export class TouristResponseSingle extends ResponseModel<SingleTouristData> {
  message: string;
  data?: SingleTouristData;
}

export class TouristResponse extends ResponseModel<TouristResponseBulk> {
  message: string;
  data?: TouristResponseBulk;
}
