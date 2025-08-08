import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SuccessResponseInterceptor } from './interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  // Global Success Response Interceptor
  app.useGlobalInterceptors(new SuccessResponseInterceptor());
  app.enableCors({
    origin: [
      'http://localhost:3000', // for local dev
      // 'https://your-frontend.vercel.app' // replace this with your actual Vercel domain
    ],
    // origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Event Buddy API')
    .setDescription('Backend APIs for Event Booking System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 7000);
}
bootstrap();
