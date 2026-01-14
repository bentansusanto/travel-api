import { ResponseModel } from './response.type';

export class SalesData {
  id: string;
  date: string;
  book_tour_id: string;
  payment_id: string;
  currency: string;
  amount: number;
  status: string;
}

export class ResponseSales extends ResponseModel<SalesData> {
  message: string;
  datas: SalesData[];
}
