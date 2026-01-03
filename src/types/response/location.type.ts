import { ResponseModel } from './response.type';

export class ResponseData {
  id: string;
  name: string;
  iso: string;
  phone_code: string;
  currency: string;
  flag: string;
  cities?: {
    id: string;
    name: string;
    longitude: string;
    latitude: string;
  }[];
}

export class LocationResponseModel extends ResponseModel<ResponseData> {
  message: string;
  data?: ResponseData;
  datas?: ResponseData[];
}
