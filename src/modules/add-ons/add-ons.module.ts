import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddOn } from './entities/add-on.entity';
import { BookingAddOn } from './entities/booking-add-on.entity';
import { AddOnsService } from './add-ons.service';
import { AddOnsController } from './add-ons.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AddOn, BookingAddOn])],
  controllers: [AddOnsController],
  providers: [AddOnsService],
  exports: [AddOnsService, TypeOrmModule],
})
export class AddOnsModule {}
