import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from '../country/entities/country.entity';
import { State } from '../country/entities/state.entity';
import { CategoryDestination } from '../destination/entities/category_destination.entity';
import { Roles } from '../users/entities/role.entity';
import { SeedsService } from './seeds.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Roles, CategoryDestination, Country, State]),
  ],
  providers: [SeedsService],
  exports: [SeedsService],
})
export class SeedsModule {}
