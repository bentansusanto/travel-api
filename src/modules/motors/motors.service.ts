import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DataSource, Repository } from 'typeorm';
import { Logger } from 'winston';
import { Merek } from './entities/merek.entity';
import { State } from '../country/entities/state.entity';
import { Motor } from './entities/motor.entity';
import { CreateMotorDto, UpdateMotorDto } from './dto/create-motor.dto';
import { MotorResponse } from 'src/types/response/motor.type';
import { MotorTranslation } from './entities/motor-translation.entity';
import { Variant } from './entities/variant.entity';
import { MotorPrice } from './entities/motor-price.entity';

@Injectable()
export class MotorsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    @InjectRepository(Motor)
    private readonly motorRepository: Repository<Motor>,
    @InjectRepository(Merek)
    private readonly merekRepository: Repository<Merek>,
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
    @InjectRepository(MotorTranslation)
    private readonly translationRepository: Repository<MotorTranslation>,
    @InjectRepository(Variant)
    private readonly variantRepository: Repository<Variant>,
    @InjectRepository(MotorPrice)
    private readonly priceRepository: Repository<MotorPrice>,
    private readonly dataSource: DataSource,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(createMotorDto: CreateMotorDto): Promise<MotorResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        merek_id,
        state_id,
        translations,
        variants,
        prices,
        ...motorData
      } = createMotorDto;

      // Validate Merek
      const merek = await this.merekRepository.findOneBy({ id: merek_id });
      if (!merek) {
        throw new HttpException('Merek not found', HttpStatus.NOT_FOUND);
      }

      // Validate State
      const state = await this.stateRepository.findOneBy({ id: state_id });
      if (!state) {
        throw new HttpException('State not found', HttpStatus.NOT_FOUND);
      }

      const motor = this.motorRepository.create({
        ...motorData,
        merek,
        state,
      });

      const savedMotor = await queryRunner.manager.save(motor);

      // Handle Translations
      if (translations && translations.length > 0) {
        const motorTranslations = translations.map((t) => {
          return this.translationRepository.create({
            ...t,
            motor: savedMotor,
            slug: this.generateSlug(t.name_motor),
          });
        });
        await queryRunner.manager.save(motorTranslations);
      }

      // Handle Variants
      if (variants && variants.length > 0) {
        const motorVariants = variants.map((v) => {
          return this.variantRepository.create({
            ...v,
            motor: savedMotor,
          });
        });
        await queryRunner.manager.save(motorVariants);
      }

      // Handle Prices
      if (prices && prices.length > 0) {
        const motorPrices = prices.map((p) => {
          return this.priceRepository.create({
            ...p,
            motor: savedMotor,
          });
        });
        await queryRunner.manager.save(motorPrices);
      }

      await queryRunner.commitTransaction();

      this.logger.debug('Success create motor');

      const result = await this.motorRepository.findOne({
        where: { id: savedMotor.id },
        relations: [
          'merek',
          'state',
          'translations',
          'variants',
          'motor_prices',
        ],
      });

      return {
        message: 'Motor created successfully',
        data: result as any,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error create motor', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during create motor',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<MotorResponse> {
    try {
      const motors = await this.motorRepository.find({
        relations: [
          'merek',
          'state',
          'translations',
          'variants',
          'motor_prices',
        ],
      });

      this.logger.debug('Success find all motors');

      return {
        message: 'Motors found successfully',
        datas: motors as any,
      };
    } catch (error) {
      this.logger.error('Error find all motors', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during find all motors',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<MotorResponse> {
    try {
      const motor = await this.motorRepository.findOne({
        where: { id },
        relations: [
          'merek',
          'state',
          'translations',
          'variants',
          'motor_prices',
        ],
      });

      if (!motor) {
        this.logger.error(`Motor not found ${id}`);
        throw new NotFoundException('Motor not found');
      }

      this.logger.debug(`Success find one motor ${id}`);

      return {
        message: 'Motor found successfully',
        data: motor as any,
      };
    } catch (error) {
      this.logger.error('Error find one motor', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during find one motor',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateMotorDto: UpdateMotorDto,
  ): Promise<MotorResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const motorResponse = await this.findOne(id);
      const motor = motorResponse.data as any as Motor;

      const {
        merek_id,
        state_id,
        translations,
        variants,
        prices,
        ...motorData
      } = updateMotorDto;

      if (merek_id) {
        const merek = await this.merekRepository.findOneBy({ id: merek_id });
        if (!merek) {
          throw new HttpException('Merek not found', HttpStatus.NOT_FOUND);
        }
        motor.merek = merek;
      }

      if (state_id) {
        const state = await this.stateRepository.findOneBy({ id: state_id });
        if (!state) {
          throw new HttpException('State not found', HttpStatus.NOT_FOUND);
        }
        motor.state = state;
      }

      Object.assign(motor, motorData);
      const updatedMotor = await queryRunner.manager.save(motor);

      // Handle Translations (Sync approach: delete and re-create or update)
      if (translations) {
        await queryRunner.manager.delete(MotorTranslation, {
          motor: { id: motor.id },
        });
        const motorTranslations = translations.map((t) => {
          return this.translationRepository.create({
            ...t,
            motor: updatedMotor,
            slug: this.generateSlug(t.name_motor),
          });
        });
        await queryRunner.manager.save(motorTranslations);
      }

      // Handle Variants
      if (variants) {
        await queryRunner.manager.delete(Variant, { motor: { id: motor.id } });
        const motorVariants = variants.map((v) => {
          return this.variantRepository.create({
            ...v,
            motor: updatedMotor,
          });
        });
        await queryRunner.manager.save(motorVariants);
      }

      // Handle Prices
      if (prices) {
        await queryRunner.manager.delete(MotorPrice, {
          motor: { id: motor.id },
        });
        const motorPrices = prices.map((p) => {
          return this.priceRepository.create({
            ...p,
            motor: updatedMotor,
          });
        });
        await queryRunner.manager.save(motorPrices);
      }

      await queryRunner.commitTransaction();

      this.logger.debug(`Success update motor ${id}`);

      const result = await this.motorRepository.findOne({
        where: { id: updatedMotor.id },
        relations: [
          'merek',
          'state',
          'translations',
          'variants',
          'motor_prices',
        ],
      });

      return {
        message: 'Motor updated successfully',
        data: result as any,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error update motor', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during update motor',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<MotorResponse> {
    try {
      const motorResponse = await this.findOne(id);
      const motor = motorResponse.data as any as Motor;

      await this.motorRepository.softRemove(motor);

      this.logger.debug(`Success delete motor ${id}`);

      return {
        message: 'Motor deleted successfully',
      };
    } catch (error) {
      this.logger.error('Error delete motor', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          Error: [
            {
              field: 'general',
              body: 'Error during delete motor',
            },
          ],
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
