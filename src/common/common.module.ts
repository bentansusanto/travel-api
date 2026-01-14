import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from 'src/modules/country/entities/country.entity';
import { State } from 'src/modules/country/entities/state.entity';
import { CategoryDestination } from 'src/modules/destination/entities/category_destination.entity';
import { DestinationTranslation } from 'src/modules/destination/entities/destination-translation.entity';
import { Destination } from 'src/modules/destination/entities/destination.entity';
import { Roles } from 'src/modules/users/entities/role.entity';
import { Session } from 'src/modules/users/entities/session.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { SessionModule } from '../modules/session/session.module';
import { ErrorsService } from './errors/errors.service';
import { AuthGuard } from './middlewares/auth.guard';
import { RolesGuard } from './middlewares/role.guard';
import { BookTour } from 'src/modules/book-tours/entities/book-tour.entity';
import { BookTourItems } from 'src/modules/book-tours/entities/book-tour-items.entity';
import { Tourist } from 'src/modules/tourists/entities/tourist.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Sale } from 'src/modules/sales/entities/sale.entity';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DATABASE_HOST'),
        port: Number(configService.get<string>('DATABASE_PORT')),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        autoLoadEntities: true,
        // synchronize: configService.get<string>('NODE_ENV') === 'production',
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        charset: 'utf8mb4',
        ssl: false,
        extra: {
          connectionLimit: 10,
          ssl: false,
        },
        connectTimeout: 60000,
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      Session,
      Roles,
      Country,
      State,
      Destination,
      CategoryDestination,
      DestinationTranslation,
      BookTour,
      BookTourItems,
      Tourist,
      Payment,
      Sale,
    ]),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    SessionModule,
  ],
  providers: [ErrorsService, AuthGuard, RolesGuard],
  exports: [TypeOrmModule, ThrottlerModule, AuthGuard, RolesGuard],
})
export class CommonModule {}
