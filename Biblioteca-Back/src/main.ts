import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configurable: "*" por defecto (desarrollo) o una lista separada
  // por comas con los orígenes permitidos (ej. el dominio de Netlify).
  const corsOrigins = process.env.CORS_ORIGINS ?? '*';
  app.enableCors({
    origin:
      corsOrigins === '*'
        ? true
        : corsOrigins
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
