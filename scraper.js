const puppeteer = require('puppeteer');
const axios = require('axios');

async function scrapeProduct(url) {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const productData = await page.evaluate(() => {
      // Extraction du titre
      const title = 
        document.querySelector('h1')?.innerText ||
        document.querySelector('[class*="title"]')?.innerText ||
        document.querySelector('[class*="product-name"]')?.innerText ||
        document.querySelector('title')?.innerText ||
        'Produit sans titre';
      
      // Extraction de la description
      const description = 
        document.querySelector('[class*="description"]')?.innerText ||
        document.querySelector('[id*="description"]')?.innerText ||
        document.querySelector('p')?.innerText ||
        'Aucune description disponible';
      
      // Extraction du prix
      let price = document.querySelector('[class*="price"]')?.innerText ||
                  document.querySelector('[id*="price"]')?.innerText ||
                  document.querySelector('[data-price]')?.getAttribute('data-price') ||
                  '0';
      
      // Nettoyer le prix
      price = price.replace(/[^0-9.,]/g, '').replace(',', '.');
      
      // Extraction des images
      const images = [];
      const imgSelectors = [
        'img[class*="product"]',
        'img[class*="main"]',
        'img[data-zoom]',
        'img[class*="gallery"]',
        '.product-image img',
        '[class*="image-container"] img'
      ];
      
      imgSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(img => {
          const src = img.src || img.dataset.src || img.dataset.original;
          if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
            images.push(src);
          }
        });
      });
      
      // Extraction des variantes
      const variants = [];
      const sizeElements = document.querySelectorAll('[class*="size"], [data-size], option[value*="size"]');
      const colorElements = document.querySelectorAll('[class*="color"], [data-color], option[value*="color"]');
      
      if (sizeElements.length > 0) {
        sizeElements.forEach(el => {
          const size = el.innerText || el.value;
          if (size && size.trim()) variants.push({ option: 'Size', value: size.trim() });
        });
      }
      
      if (colorElements.length > 0) {
        colorElements.forEach(el => {
          const color = el.innerText || el.value;
          if (color && color.trim()) variants.push({ option: 'Color', value: color.trim() });
        });
      }
      
      return {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price) || 0,
        images: [...new Set(images)].slice(0, 10), // Max 10 images uniques
        variants: variants.length > 0 ? variants : [{ option: 'Default', value: 'Default' }]
      };
    });
    
    await browser.close();
    return productData;
    
  } catch (error) {
    if (browser) await browser.close();
    throw new Error(`Erreur lors du scraping: ${error.message}`);
  }
}

async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return {
      buffer: Buffer.from(response.data),
      contentType: response.headers['content-type']
    };
  } catch (error) {
    throw new Error(`Impossible de télécharger l'image: ${error.message}`);
  }
}

module.exports = { scrapeProduct, downloadImage };