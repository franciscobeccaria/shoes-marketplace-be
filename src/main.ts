import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.CORS_URLS ? process.env.CORS_URLS.split(',') : [];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  });

  const port = process.env.PORT || 3000;
  console.log(`App listening on port ${port}`); // Logging the port

  await app.listen(port);

  // Log when the app has successfully started
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
