import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Country as CscCountry, State as CscState } from 'country-state-city';
import Hashids from 'hashids';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LocationResponseModel } from 'src/types/response/location.type';
import { Repository } from 'typeorm';
import { Logger } from 'winston';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { Country } from './entities/country.entity';
import { State } from './entities/state.entity';

@Injectable()
export class CountryService {
  private hashIds: Hashids;
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
  ) {
    this.hashIds = new Hashids(process.env.ID_SECRET, 10);
  }

  async create(
    createCountryDto: CreateCountryDto,
  ): Promise<LocationResponseModel> {
    try {
      // search country by name
      const allCountries = CscCountry.getAllCountries();
      const country = allCountries.find(
        (c) => c.name.toLowerCase() === createCountryDto.name.toLowerCase(),
      );
      if (!country) {
        this.logger.error('Invalid country name');
        throw new HttpException('Invalid country name', HttpStatus.BAD_REQUEST);
      }

      // Cek apakah country sudah ada di DB
      const existing = await this.countryRepository.findOne({
        where: { iso: country.isoCode },
      });
      if (existing) {
        throw new HttpException('Country already exists', HttpStatus.CONFLICT);
      }
      // create country
      const newCountry = this.countryRepository.create({
        id: this.hashIds.encode(Date.now()),
        name: country.name,
        iso: country.isoCode,
        flag: country.flag,
        phone_code: country.phonecode,
        currency: country.currency,
      });
      await this.countryRepository.save(newCountry);

      // Ambil semua city berdasarkan isoCode country
      const states = CscState.getStatesOfCountry(country.isoCode) || [];

      const newStates = states.map((state, index) => {
        return this.stateRepository.create({
          id: this.hashIds.encode(
            Date.now(),
            index,
            Math.floor(Math.random() * 1000000),
          ),
          name: state.name,
          country: {
            id: newCountry.id,
          },
          longitude: state.longitude,
          latitude: state.latitude,
        });
      });

      await this.stateRepository.save(newStates);

      this.logger.debug(`Create country ${country.name} successfully`);

      return {
        message: 'Create country successfully',
        data: {
          id: newCountry.id,
          name: newCountry.name,
          iso: newCountry.iso,
          flag: newCountry.flag,
          phone_code: newCountry.phone_code,
          currency: newCountry.currency,
          cities: newStates.map((state) => {
            return {
              id: state.id,
              name: state.name,
              longitude: state.longitude,
              latitude: state.latitude,
            };
          }),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error creating country', error);
      throw new HttpException(
        'Error creating country',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // find all country
  async findAll(): Promise<LocationResponseModel> {
    try {
      const countries = await this.countryRepository.find({
        relations: {
          states: true,
        },
      });
      if (countries.length === 0) {
        throw new HttpException('Country not found', HttpStatus.NOT_FOUND);
      }
      return {
        message: 'Get all country successfully',
        datas: countries.map((country) => {
          return {
            id: country.id,
            name: country.name,
            iso: country.iso,
            flag: country.flag,
            phone_code: country.phone_code,
            currency: country.currency,
            cities: country.states.map((state) => {
              return {
                id: state.id,
                name: state.name,
                longitude: state.longitude,
                latitude: state.latitude,
              };
            }),
          };
        }),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error getting all country', error);
      throw new HttpException(
        'Error getting all country',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string):Promise<LocationResponseModel> {
    try {
      const country = await this.countryRepository.findOne({
        where: { id },
        relations: {
          states: true,
        },
      });
      if (!country) {
        throw new HttpException('Country not found', HttpStatus.NOT_FOUND);
      }
      return {
        message: 'Get country successfully',
        data: {
          id: country.id,
          name: country.name,
          iso: country.iso,
          flag: country.flag,
          phone_code: country.phone_code,
          currency: country.currency,
          cities: country.states.map((state) => {
            return {
              id: state.id,
              name: state.name,
              longitude: state.longitude,
              latitude: state.latitude,
            };
          }),
        },
      };
    } catch (error) {
      this.logger.error('Error getting country', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error getting country',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  update(id: string, updateCountryDto: UpdateCountryDto) {
    return `This action updates a #${id} country`;
  }

  remove(id: number) {
    return `This action removes a #${id} country`;
  }
}
