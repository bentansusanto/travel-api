import { Module } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { MotorsModule } from '../motors/motors.module';
import { AddOnsModule } from '../add-ons/add-ons.module';

@Module({
  imports: [MotorsModule, AddOnsModule],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationsModule {}
