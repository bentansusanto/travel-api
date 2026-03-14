import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Motor } from '../motors/entities/motor.entity';
import { AddOn, AddOnCategory } from '../add-ons/entities/add-on.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class RecommendationService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    @InjectRepository(Motor)
    private readonly motorRepository: Repository<Motor>,
    @InjectRepository(AddOn)
    private readonly addOnRepository: Repository<AddOn>,
  ) {}

  async getSuggestionsAfterTourPayment(stateId: string) {
    this.logger.debug(`Getting suggestions for state: ${stateId}`);

    // 1. Suggest motors in the same state
    const motors = await this.motorRepository.find({
      where: {
        state: { id: stateId },
        is_available: true,
      },
      relations: ['merek', 'translations', 'motor_prices'],
      take: 5,
    });

    // 2. Suggest general add-ons or relevant tour add-ons
    const generalAddOns = await this.addOnRepository.find({
      where: {
        category: AddOnCategory.GENERAL,
      },
      take: 5,
    });

    return {
      motors,
      addOns: generalAddOns,
    };
  }
}
