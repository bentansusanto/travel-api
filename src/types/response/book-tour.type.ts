import { StatusBookTour } from 'src/modules/book-tours/entities/book-tour.entity';
import { ResponseModel } from './response.type';

export class TourResponseData {
  id: string;
  user_id: string;
  country_id: string;
  book_tour_items: {
    id: string;
    destination_id: string;
    visit_date: Date;
  }[];
  subtotal: number;
  status: StatusBookTour;
  created_at?: Date;
  updated_at?: Date;
}

export class TourResponse extends ResponseModel<TourResponseData> {
  message: string;
  data?: TourResponseData;
  datas?: TourResponseData[];
}
