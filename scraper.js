const axios = require('axios'); 
const cheerio = require('cheerio'); 
 
async function scrapeProduct(url) { 
  try { 
    const response = await axios.get(url, { 
      headers: {'User-Agent': 'Mozilla/5.0'}, 
      timeout: 10000 
    }); 
    const $ = cheerio.load(response.data); 
    const title = $('h1').first().text().trim() || 'Produit'; 
    const price = 99.99; 
    const images = []; 
    $('img').each((i, el) => { 
      const src = $(el).attr('src'); 
      if (src && src.includes('http')) images.push(src); 
    }); 
    return {title, description: 'Import YONOX', price, images: images.slice(0,5), variants: []}; 
  } catch (error) { 
    throw new Error('Scraping error: ' + error.message); 
  } 
} 
 
async function downloadImage(url) { 
  const response = await axios.get(url, {responseType: 'arraybuffer'}); 
  return {buffer: Buffer.from(response.data), contentType: 'image/jpeg'}; 
} 
 
module.exports = {scrapeProduct, downloadImage}; 
