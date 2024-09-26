import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(@InjectModel('Product') private productModel: Model<Product>) {}

  async scrapeAdidas(): Promise<any> {
    await this.productModel.deleteMany({ store: 'adidas' });

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
        '--single-process',
      ],
      executablePath: process.env.CHROME_BIN || null,
    });

    const page = await browser.newPage();

    // Disable JavaScript specifically for adidas
    await page.setJavaScriptEnabled(false);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto('https://www.adidas.com.ar/calzado-hombre', { waitUntil: 'load' });

    const products = await page.evaluate(() => {
      const items = document.querySelectorAll('.product-card_product-card__a9BIh');
      const results = [];
      items.forEach(item => {
        const product = {
          name: item.querySelector('.product-card-description_name__xHvJ2')?.textContent || 'N/A',
          price: item.querySelector('.gl-price-item')?.textContent || 'N/A',
          image: item.querySelector('img')?.src || 'N/A',
          link: item.querySelector('a')?.href || 'N/A',
          store: 'adidas',
        };
        results.push(product);
      });
      return results;
    });

    await browser.close();
    return this.saveProducts(products);
  }

  async scrapeGrid(): Promise<any> {
    await this.productModel.deleteMany({ store: 'grid' });

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
        '--single-process',
      ],
      executablePath: process.env.CHROME_BIN || null,
    });

    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto('https://www.grid.com.ar/calzado/hombre?initialMap=genero&map=category-1,genero&order=OrderByReleaseDateDESC', { waitUntil: 'networkidle2' });

    const products = await page.evaluate(() => {
      const items = document.querySelectorAll('.vtex-search-result-3-x-galleryItem');
      const results = [];
      items.forEach(item => {
        const product = {
          name: item.querySelector('.vtex-product-summary-2-x-productBrand.vtex-product-summary-2-x-productBrand--product-box.vtex-product-summary-2-x-brandName.vtex-product-summary-2-x-brandName--product-box.t-body').textContent || 'N/A',
          price: item.querySelector('.vtex-store-components-3-x-priceContainer').textContent || 'N/A',
          image: item.querySelector('img')?.src || 'N/A',
          link: item.querySelector('a')?.href || 'N/A',
          store: 'grid',
        };
        results.push(product);
      });
      return results;
    });

    await browser.close();
    return this.saveProducts(products);
  }

  private async saveProducts(products: any[]): Promise<any[]> {
    return await Promise.all(
      products.map(async (product) => {
        const newProduct = new this.productModel(product);
        return newProduct.save();
      }),
    );
  }
  
  async getProducts(): Promise<Product[]> {
    return this.productModel.find().exec();
  }
}
