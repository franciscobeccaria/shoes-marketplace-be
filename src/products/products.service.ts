import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(@InjectModel('Product') private productModel: Model<Product>) {}

  async scrapeProducts(storeUrl: string): Promise<any> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--disable-features=site-per-process',
        '--disable-site-isolation-trials',
        '--disable-background-timer-throttling',
        '--no-zygote',
        '--single-process'
      ],
      executablePath: process.env.CHROME_BIN || null,
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(storeUrl);

    // Example logic to scrape products by class name (update accordingly)
    const products = await page.evaluate(() => {
      const items = document.querySelectorAll('.product-card_product-card__a9BIh');
      const results = [];
      items.forEach(item => {
        const product = {
          name: item.querySelector('.product-card-description_name__xHvJ2').textContent,
          price: item.querySelector('.gl-price-item').textContent,
          image: item.querySelector('img').src,
          link: item.querySelector('a').href,
        };
        results.push(product);
      });
      return results;
    });

    await browser.close();
    
    // Save each product to MongoDB
    const savedProducts = await Promise.all(
      products.map(async (product) => {
        const newProduct = new this.productModel(product);
        return newProduct.save();
      }),
    );

    return savedProducts;
  }
}
