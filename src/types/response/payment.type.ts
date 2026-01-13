import { ResponseModel } from './response.type';

export class PaymentData {
  id: string;
  user_id: string;
  book_tour_id?: string;
  total_tourists?: number;
  invoice_code?: string;
  amount: number;
  currency: string;
  transaction_id?: string;
  payment_method: string;
  payer_email?: string;
  redirect_url?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class PaymentResponse extends ResponseModel<PaymentData> {
  message: string;
  data?: PaymentData;
  datas?: PaymentData[];
}
