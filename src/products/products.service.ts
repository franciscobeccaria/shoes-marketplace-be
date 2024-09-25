import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class ProductsService {
  async scrapeProducts(storeUrl: string): Promise<any> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/app/.cache/puppeteer/chrome',
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
    return products;
  }
}
