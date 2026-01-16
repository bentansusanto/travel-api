import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'src/config/logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { Roles } from './entities/role.entity';
import { Session } from './entities/session.entity';
import { User } from './entities/user.entity';
import { SessionsModule } from './sessions/sessions.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ProfilesModule } from './profiles/profiles.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    AuthModule,
    LoggerModule,
    SessionsModule,
    TypeOrmModule.forFeature([User, Session, Roles]),
    ProfilesModule,
  ],
  exports: [UsersService],
})
export class UsersModule {}
