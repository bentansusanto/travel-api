import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import { Logger } from 'winston';
import { AddOn } from './entities/add-on.entity';
import { CreateAddOnDto, UpdateAddOnDto } from './dto/create-add-on.dto';
import { AddOnResponse } from 'src/types/response/add-on.type';

@Injectable()
export class AddOnsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    @InjectRepository(AddOn)
    private readonly addOnRepository: Repository<AddOn>,
  ) {}

  async create(createAddOnDto: CreateAddOnDto): Promise<AddOnResponse> {
    try {
      const addOn = this.addOnRepository.create(createAddOnDto);
      const savedAddOn = await this.addOnRepository.save(addOn);

      this.logger.debug('Success create add-on');

      return {
        message: 'Add-on created successfully',
        data: savedAddOn as any,
      };
    } catch (error) {
      this.logger.error('Error create add-on', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during create add-on',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(): Promise<AddOnResponse> {
    try {
      const addOns = await this.addOnRepository.find();

      this.logger.debug('Success find all add-ons');

      return {
        message: 'Add-ons found successfully',
        datas: addOns as any,
      };
    } catch (error) {
      this.logger.error('Error find all add-ons', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during find all add-ons',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<AddOnResponse> {
    try {
      const addOn = await this.addOnRepository.findOne({ where: { id } });

      if (!addOn) {
        this.logger.error(`Add-on not found ${id}`);
        throw new NotFoundException('Add-on not found');
      }

      this.logger.debug(`Success find one add-on ${id}`);

      return {
        message: 'Add-on found successfully',
        data: addOn as any,
      };
    } catch (error) {
      this.logger.error('Error find one add-on', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during find one add-on',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateAddOnDto: UpdateAddOnDto): Promise<AddOnResponse> {
    try {
      const addOnResponse = await this.findOne(id);
      const addOn = addOnResponse.data as any as AddOn;

      Object.assign(addOn, updateAddOnDto);
      const updatedAddOn = await this.addOnRepository.save(addOn);

      this.logger.debug(`Success update add-on ${id}`);

      return {
        message: 'Add-on updated successfully',
        data: updatedAddOn as any,
      };
    } catch (error) {
      this.logger.error('Error update add-on', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during update add-on',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string): Promise<AddOnResponse> {
    try {
      const addOnResponse = await this.findOne(id);
      const addOn = addOnResponse.data as any as AddOn;

      await this.addOnRepository.softRemove(addOn);

      this.logger.debug(`Success delete add-on ${id}`);

      return {
        message: 'Add-on deleted successfully',
      };
    } catch (error) {
      this.logger.error('Error delete add-on', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during delete add-on',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findByCategory(category: string): Promise<AddOnResponse> {
    try {
      const addOns = await this.addOnRepository.find({
        where: { category: category as any },
      });

      this.logger.debug(`Success find add-ons by category ${category}`);

      return {
        message: 'Add-ons found successfully',
        datas: addOns as any,
      };
    } catch (error) {
      this.logger.error('Error find add-ons by category', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during find add-ons by category',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
