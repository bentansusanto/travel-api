import { ResponseModel } from './response.type';

export class RoleData {
  id: string;
  name: string;
  code: string;
  self_register: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class RoleResponse extends ResponseModel<RoleData> {
  message: string;
  data?: RoleData;
  datas?: RoleData[];
}
