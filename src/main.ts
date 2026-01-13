import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ErrorsService } from './common/errors/errors.service';
import { AuthGuard } from './common/middlewares/auth.guard';
import { RolesGuard } from './common/middlewares/role.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalGuards(app.get(AuthGuard), app.get(RolesGuard));
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new ErrorsService());
  // app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  const origins = [
    'http://localhost:3200',
    'http://localhost:3700',
    'https://pacifictravelindo.com',
    'https://www.pacifictravelindo.com',
    'https://pasifik.my.id',
  ];
  app.enableCors({
    origin: function (origin, callback) {
      const allowedOrigins = origins;
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  const port = process.env.PORT || 8000;
  await app.listen(port);
  console.log(`Application is running port: ${port}`);
}
bootstrap();
