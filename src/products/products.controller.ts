import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('scrape')
  async scrapeProducts(@Query('storeUrl') storeUrl: string): Promise<any> {
    return this.productsService.scrapeProducts(storeUrl);
  }
}
