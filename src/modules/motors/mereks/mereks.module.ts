import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merek } from '../entities/merek.entity';
import { MereksController } from './mereks.controller';
import { MereksService } from './mereks.service';

@Module({
  controllers: [MereksController],
  providers: [MereksService],
  imports: [TypeOrmModule.forFeature([Merek])],
  exports: [MereksService],
})
export class MereksModule {}
