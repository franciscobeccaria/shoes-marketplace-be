import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('scrape/adidas')
  async scrapeAdidas() {
    return this.productsService.scrapeAdidas();
  }

  @Get('scrape/grid')
  async scrapeGrid() {
    return this.productsService.scrapeGrid();
  }

  @Get()
  async getProducts() {
    return this.productsService.getProducts();
  }

  // Simple GET route for testing
  @Get('test')
  async getTest(): Promise<any> {
    return { message: 'App is running correctly!' };
  }
}
