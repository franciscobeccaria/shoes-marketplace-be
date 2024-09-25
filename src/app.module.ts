import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI), // Use environment variable for MongoDB connection
    ProductsModule,
  ],
})
export class AppModule {}
