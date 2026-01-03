import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { State } from '../country/entities/state.entity';
import { DestinationController } from './destination.controller';
import { DestinationService } from './destination.service';
import { CategoryDestination } from './entities/category_destination.entity';
import { DestinationTranslation } from './entities/destination-translation.entity';
import { Destination } from './entities/destination.entity';

@Module({
  controllers: [DestinationController],
  providers: [DestinationService],
  imports: [
    TypeOrmModule.forFeature([
      Destination,
      CategoryDestination,
      DestinationTranslation,
      State,
    ]),
  ],
  exports: [DestinationService],
})
export class DestinationModule {}
