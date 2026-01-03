import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { createWinstonOptions } from './logger.config';

@Module({
  imports: [WinstonModule.forRoot(createWinstonOptions())],
  exports: [WinstonModule],
})
export class LoggerModule {}
