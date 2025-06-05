import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(@InjectModel('Product') private productModel: Model<Product>) {}

  async scrapeAdidas(): Promise<any> {
    await this.productModel.deleteMany({ store: 'adidas' });

    puppeteer.use(StealthPlugin());

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    const page = await browser.newPage();

    // Disable JavaScript for adidas
    console.log('Disabling JavaScript for Adidas scrape.');
    await page.setJavaScriptEnabled(false);
    await page.setViewport({ width: 1366, height: 768 }); // Standard viewport
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36'); // Common user agent

    console.log('Navigating to Adidas page (JS disabled)...');
    try {
      await page.goto('https://www.adidas.com.ar/calzado-hombre', { waitUntil: 'load', timeout: 60000 });
      console.log(`Adidas page navigation attempt finished. URL: ${page.url()}`);
      // Screenshot to see what page is loaded (e.g., block page)
      await page.screenshot({ path: 'adidas_debug_01_afterGoTo.png', fullPage: true });
      console.log('Screenshot: adidas_debug_01_afterGoTo.png taken.');
    } catch (e) {
      console.error('Error navigating to Adidas page:', e);
      await page.screenshot({ path: 'adidas_debug_02_navigation_ERROR.png', fullPage: true });
      console.log('Screenshot on navigation error: adidas_debug_02_navigation_ERROR.png taken.');
      await browser.close();
      throw e;
    }

    let products: CreateProductDto[] = [];
    try {
      console.log('Attempting to evaluate Adidas page content...');
      products = await page.evaluate(() => {
        const items = document.querySelectorAll('.product-card_product-card__a9BIh'); // Original selector
        const results: CreateProductDto[] = [];
        items.forEach(item => {
          const name = item.querySelector('.product-card-description_name__xHvJ2')?.textContent?.trim() || 'N/A';
          const price = item.querySelector('.gl-price-item')?.textContent?.trim() || 'N/A';
          const image = item.querySelector('img')?.src || 'N/A';
          let productLink = 'N/A';
          const hrefAttribute = item.querySelector('a')?.getAttribute('href');
          if (hrefAttribute) {
            if (hrefAttribute.startsWith('http')) {
              productLink = hrefAttribute;
            } else {
              productLink = (hrefAttribute.startsWith('/') ? 'https://www.adidas.com.ar' : 'https://www.adidas.com.ar/') + hrefAttribute;
            }
          }
          results.push({ name, price, image, link: productLink, store: 'adidas' });
        });
        return results;
      });
      console.log(`Adidas: Page evaluated. Found ${products.length} products.`);
      if (products.length === 0) {
        console.warn('Adidas: No products found. Check adidas_debug_01_afterGoTo.png to see if the page was blocked.');
      }
    } catch (e) {
      console.error('Error during Adidas page.evaluate:', e);
      await page.screenshot({ path: 'adidas_debug_03_evaluate_ERROR.png', fullPage: true });
      console.log('Screenshot on evaluate error: adidas_debug_03_evaluate_ERROR.png taken.');
      // products will be an empty array, which is fine to return
    }

    await browser.close();
    console.log('Adidas scrape attempt finished.');
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
