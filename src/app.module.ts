import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { BookToursModule } from './modules/book-tours/book-tours.module';
import { CountryModule } from './modules/country/country.module';
import { DestinationModule } from './modules/destination/destination.module';
import { SeedsModule } from './modules/seeds/seeds.module';
import { TouristsModule } from './modules/tourists/tourists.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    CommonModule,
    UsersModule,
    SeedsModule,
    CountryModule,
    DestinationModule,
    BookToursModule,
    TouristsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
