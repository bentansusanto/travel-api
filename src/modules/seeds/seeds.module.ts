import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from '../users/entities/role.entity';
import { CategoryDestination } from '../destination/entities/category_destination.entity';
import { SeedsService } from './seeds.service';

@Module({
  imports: [TypeOrmModule.forFeature([Roles, CategoryDestination])],
  providers: [SeedsService],
  exports: [SeedsService],
})
export class SeedsModule {}
