import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../entities/profile.entity';
import { UsersService } from '../users.service';

@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService, UsersService],
  imports: [TypeOrmModule.forFeature([Profile])],
})
export class ProfilesModule {}
