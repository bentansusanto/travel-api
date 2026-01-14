import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookToursModule } from '../book-tours/book-tours.module';
import { SalesModule } from '../sales/sales.module';
import { TouristsModule } from '../tourists/tourists.module';
import { UsersModule } from '../users/users.module';
import { Payment } from './entities/payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaypalService } from './paypal.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaypalService],
  imports: [
    TypeOrmModule.forFeature([Payment]),
    BookToursModule,
    UsersModule,
    TouristsModule,
    SalesModule,
  ],
})
export class PaymentsModule {}
