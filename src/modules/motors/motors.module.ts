import { Module } from '@nestjs/common';
import { MotorsService } from './motors.service';
import { MotorsController } from './motors.controller';
import { MereksModule } from './mereks/mereks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Motor } from './entities/motor.entity';
import { Merek } from './entities/merek.entity';
import { State } from '../country/entities/state.entity';

@Module({
  controllers: [MotorsController],
  providers: [MotorsService],
  imports: [TypeOrmModule.forFeature([Motor, Merek, State]), MereksModule],
})
export class MotorsModule {}
