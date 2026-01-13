import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookToursModule } from '../book-tours/book-tours.module';
import { Tourist } from './entities/tourist.entity';
import { TouristsController } from './tourists.controller';
import { TouristsService } from './tourists.service';

@Module({
  controllers: [TouristsController],
  providers: [TouristsService],
  imports: [TypeOrmModule.forFeature([Tourist]), BookToursModule],
  exports: [TouristsService],
})
export class TouristsModule {}
