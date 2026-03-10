import { Module } from '@nestjs/common';
import { MotorsService } from './motors.service';
import { MotorsController } from './motors.controller';

@Module({
  controllers: [MotorsController],
  providers: [MotorsService],
})
export class MotorsModule {}
