import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';

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
      executablePath: process.env.CHROME_BIN || undefined,
    });

    const page = await browser.newPage();

    // Disable JavaScript specifically for adidas
    await page.setJavaScriptEnabled(false);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto('https://www.adidas.com.ar/calzado-hombre', { waitUntil: 'load' });

    const products = await page.evaluate(() => {
      const items = document.querySelectorAll('.product-card_product-card__a9BIh');
      const results: CreateProductDto[] = [];
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
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Verbose event listeners - uncomment if deep debugging is required
    /*
    page.on('error', err => {
      console.error('Puppeteer page error:', err);
    });
    page.on('pageerror', pageErr => {
      console.error('Puppeteer page JavaScript error:', pageErr);
    });
    page.on('requestfailed', request => {
      console.error('Puppeteer request failed:', request.url(), request.failure()?.errorText);
    });
    */

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    try {
      console.log(`Attempting to navigate to Grid with 60s timeout, waitUntil: 'load'...`);
      await page.goto('https://www.grid.com.ar/calzado/hombre?initialMap=genero&map=category-1,genero&order=OrderByReleaseDateDESC', { waitUntil: 'load', timeout: 60000 }); 
      await page.screenshot({ path: 'grid_debug_03_afterGoTo_SUCCESS.png', fullPage: true }); // Renamed for clarity
      console.log('Screenshot taken after successful goto: grid_debug_03_afterGoTo_SUCCESS.png');
    } catch (error) {
      console.warn('Warning: page.goto timed out or failed. Proceeding with scraping attempt as screenshot indicated content might be present.');
      if (error instanceof Error) {
        console.error('page.goto error details: ', error.message);
      } else {
        console.error('page.goto encountered an unknown error: ', error);
      }
      try {
        await page.screenshot({ path: 'grid_debug_04_goToTIMEDOUT_or_FAILED.png', fullPage: true }); // Renamed for clarity
        console.log('Screenshot taken after goto timeout/failure: grid_debug_04_goToTIMEDOUT_or_FAILED.png');
      } catch (screenshotError) {
        if (screenshotError instanceof Error) {
          console.error('Failed to take screenshot on goto error:', screenshotError.message);
        } else {
          console.error('Failed to take screenshot on goto error (unknown error type):', screenshotError);
        }
      }
      // IMPORTANT: We are NOT re-throwing the error here to allow scraping attempt
    }

    // Add a small delay to ensure content is settled, especially if goto timed out
    console.log('Adding a 5-second delay before attempting to evaluate page content...');
    await new Promise(resolve => setTimeout(resolve, 5000)); 

    console.log('Attempting to evaluate page content for products...');
    const products = await page.evaluate(() => {
      const items = document.querySelectorAll('.vtex-search-result-3-x-galleryItem');
      const results: CreateProductDto[] = [];
      items.forEach(item => {
        const product = {
          name: item.querySelector('.vtex-product-summary-2-x-productBrand.vtex-product-summary-2-x-productBrand--product-box.vtex-product-summary-2-x-brandName.vtex-product-summary-2-x-brandName--product-box.t-body')?.textContent || 'N/A',
          price: item.querySelector('.vtex-store-components-3-x-priceContainer')?.textContent || 'N/A',
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
    const uniqueProducts = products.filter(
      (product, index, self) =>
        index === self.findIndex((p) => p.link === product.link),
    );

    const formattedPriceProducts = uniqueProducts.map(product => {
      const priceString = product.price;
      const formattedPrice = priceString !== 'N/A' 
        ? parseFloat(priceString.replace(/[^\d,]/g, '').replace(',', '.'))
        : null;
  
      return {
        ...product,
        price: formattedPrice,
      };
    });
  
    return await Promise.all(
      formattedPriceProducts.map(async (product) => {
        const newProduct = new this.productModel(product);
        return newProduct.save();
      }),
    );
  }
  
  async getProducts(): Promise<Product[]> {
    return this.productModel.find().exec();
  }
}
