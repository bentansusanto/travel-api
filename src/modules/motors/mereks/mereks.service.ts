import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Merek } from '../entities/merek.entity';
import { CreateMerekDto, UpdateMerekDto } from './dto/create-merek.dto';

import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { MerekResponse } from 'src/types/response/motor.type';

@Injectable()
export class MereksService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger:Logger,
    @InjectRepository(Merek)
    private readonly merekRepository: Repository<Merek>,
  ) {}

  async create(createMerekDto: CreateMerekDto): Promise<MerekResponse> {
    try {
      const existingMerek = await this.merekRepository.findOneBy({
        name_merek: createMerekDto.name_merek,
      });

      if (existingMerek) {
        throw new HttpException(
          `Merek with name ${createMerekDto.name_merek} already exists`,
          HttpStatus.CONFLICT,
        );
      }

      const merek = this.merekRepository.create(createMerekDto);
      const savedMerek = await this.merekRepository.save(merek);

      this.logger.debug('Success create merek');

      return {
        message: 'Merek created successfully',
        data: {
          id: savedMerek.id,
          name_merek: savedMerek.name_merek,
          createdAt: savedMerek.created_at,
          updatedAt: savedMerek.updated_at,
        },
      };
    } catch (error) {
      this.logger.error('Error create merek', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during create merek',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(): Promise<MerekResponse> {
    try {
      const mereks = await this.merekRepository.find();
      const mappedMereks = mereks.map((m) => ({
        id: m.id,
        name_merek: m.name_merek,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      }));

      this.logger.debug('Success find all mereks');

      return {
        message: 'Mereks found successfully',
        datas: mappedMereks,
      };
    } catch (error) {
      this.logger.error('Error find all mereks', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during find all mereks',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<MerekResponse> {
    try {
      const merek = await this.merekRepository.findOneBy({ id });
      if (!merek) {
        this.logger.error(`Merek with id ${id} not found`);
        throw new HttpException(
          {
            Error: [
              {
                field: 'id',
                body: 'Merek not found',
              },
            ],
          },
          HttpStatus.NOT_FOUND,
        );
      }

      this.logger.debug(`Success find one merek ${id}`);

      return {
        message: 'Merek found successfully',
        data: {
          id: merek.id,
          name_merek: merek.name_merek,
          createdAt: merek.created_at,
          updatedAt: merek.updated_at,
        },
      };
    } catch (error) {
      this.logger.error('Error find one merek', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during find one merek',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateMerekDto: UpdateMerekDto): Promise<MerekResponse> {
    try {
      const merek = await this.findOne(id);

      if (updateMerekDto.name_merek) {
        const existingMerek = await this.merekRepository.findOneBy({
          name_merek: updateMerekDto.name_merek,
          id: Not(id),
        });

        if (existingMerek) {
          throw new HttpException(
            `Merek with name ${updateMerekDto.name_merek} already exists`,
            HttpStatus.CONFLICT,
          );
        }
      }

      Object.assign(merek.data, updateMerekDto);
      const updatedMerek = await this.merekRepository.save(merek.data);

      this.logger.debug(`Success update merek ${id}`);

      return {
        message: 'Merek updated successfully',
        data: {
          id: updatedMerek.id,
          name_merek: updatedMerek.name_merek,
          createdAt: updatedMerek.created_at,
          updatedAt: updatedMerek.updated_at,
        },
      };
    } catch (error) {
      this.logger.error('Error update merek', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during update merek',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string): Promise<MerekResponse> {
    try {
      const merek = await this.merekRepository.findOneBy({ id });
      if (!merek) {
        this.logger.error(`Merek with id ${id} not found`);
        throw new HttpException(
          {
            Error: [
              {
                field: 'id',
                body: 'Merek not found',
              },
            ],
          },
          HttpStatus.NOT_FOUND,
        );
      }

      await this.merekRepository.softRemove(merek);

      this.logger.debug(`Success delete merek ${id}`);

      return {
        message: 'Merek deleted successfully',
      };
    } catch (error) {
      this.logger.error('Error delete merek', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during delete merek',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
