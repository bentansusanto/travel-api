import { ResponseModel } from './response.type';

export class ProfileData {
  id: string;
  user_id: string;
  phone_number: string;
  address: string;
  state: string;
  country: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProfileResponse extends ResponseModel<ProfileData> {
  message: string;
  data?: ProfileData;
}
