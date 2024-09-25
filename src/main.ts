import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Starting NestJS application...'); // Logging the start of the app
  
  const app = await NestFactory.create(AppModule);

  // Ensure the app binds to the port provided by Heroku or fallback to 3000 for local development
  const port = process.env.PORT || 3000;
  console.log(`App listening on port ${port}`); // Logging the port

  await app.listen(port);

  // Log when the app has successfully started
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
