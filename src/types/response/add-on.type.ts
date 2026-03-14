import { ResponseModel } from "./response.type";

export class AddOnData {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class AddOnResponse extends ResponseModel<AddOnData> {
  message: string;
  data?: AddOnData;
  datas?: AddOnData[];
}
