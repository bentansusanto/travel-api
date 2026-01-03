import { Language } from 'src/modules/destination/entities/destination-translation.entity';
import { ResponseModel } from './response.type';

export type DestinationResponse = {
  id: string;
  state_id: string;
  location: string;
  category_destination_id: string;
  price: number;
  country_id?: string;
  country_name?: string;
  translations?: DestinationTranslationResponse[];
};

export type DestinationTranslationResponse = {
  id: number;
  destination_id: string;
  language_code: Language;
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
  image: string[];
  detail_tour: string[];
  facilities: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryDestinationResponse = {
  id: string;
  name: string;
};

export interface ResponseDestination extends ResponseModel<DestinationResponse> {
  message: string;
  data?: DestinationResponse;
  datas?: DestinationResponse[];
}

export interface ResponseDestinationTranslation extends ResponseModel<DestinationTranslationResponse> {
  message: string;
  data: DestinationTranslationResponse;
}
