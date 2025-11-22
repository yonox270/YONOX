require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { scrapeProduct, downloadImage } = require('./scraper');
const { Shopify } = require('@shopify/shopify-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration Shopify
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: ['write_products', 'read_products'],
  HOST_NAME: 'yonox.vercel.app',
  IS_EMBEDDED_APP: false,
  API_VERSION: '2024-10'
});

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'yonox_secret_key',
  resave: false,
  saveUninitialized: false
}));

// Route OAuth - Installation
app.get('/auth', async (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).send('Missing shop parameter');
  
  const authRoute = await Shopify.Auth.beginAuth(req, res, shop, '/auth/callback', false);
  return res.redirect(authRoute);
});

// Route OAuth - Callback
app.get('/auth/callback', async (req, res) => {
  try {
    const session = await Shopify.Auth.validateAuthCallback(req, res, req.query);
    req.session.shopifySession = session;
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Homepage
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>YONOX</title>
      <style>
        body { font-family: Arial; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
               min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
        .container { background: white; padding: 40px; border-radius: 20px; max-width: 500px; text-align: center; }
        h1 { color: #667eea; font-size: 2.5em; }
        .emoji { font-size: 3em; }
        ul { list-style: none; text-align: left; padding: 20px; }
        li:before { content: "✓ "; color: #667eea; font-weight: bold; }
        a { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; 
            padding: 15px 40px; text-decoration: none; border-radius: 50px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="emoji">🚀</div>
        <h1>YONOX</h1>
        <p>Import Intelligent de Produits</p>
        <ul>
          <li>Import depuis n'importe quel site</li>
          <li>Extraction automatique des images</li>
          <li>Détection des prix et variantes</li>
        </ul>
        <a href="/dashboard">Commencer</a>
      </div>
    </body>
    </html>
  `);
});

// Dashboard
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>YONOX Dashboard</title>
      <style>
        body { font-family: Arial; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
               min-height: 100vh; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 20px; }
        h1 { color: #667eea; }
        input { width: 100%; padding: 15px; border: 2px solid #ddd; border-radius: 10px; font-size: 1em; box-sizing: border-box; }
        button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; 
                 padding: 15px 40px; border: none; border-radius: 50px; cursor: pointer; 
                 font-size: 1.1em; width: 100%; margin-top: 20px; }
        #status { margin-top: 20px; padding: 15px; border-radius: 10px; display: none; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📦 Importer un Produit</h1>
        <form id="form">
          <input type="url" id="url" placeholder="https://example.com/product" required>
          <button type="submit">🚀 Importer</button>
        </form>
        <div id="status"></div>
      </div>
      <script>
        document.getElementById('form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const url = document.getElementById('url').value;
          const status = document.getElementById('status');
          status.style.display = 'block';
          status.className = '';
          status.textContent = '⏳ Import en cours...';
          try {
            const res = await fetch('/import', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({url})
            });
            const data = await res.json();
            if(res.ok) {
              status.className = 'success';
              status.textContent = '✅ Importé: ' + data.title;
            } else {
              status.className = 'error';
              status.textContent = '❌ ' + data.error;
            }
          } catch(err) {
            status.className = 'error';
            status.textContent = '❌ Erreur: ' + err.message;
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Import produit
app.post('/import', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({error: 'URL manquante'});
  
  try {
    const product = await scrapeProduct(url);
    res.json({success: true, title: product.title, price: product.price});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Privacy Policy
app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>YONOX Privacy Policy</title></head>
    <body style="max-width:900px;margin:50px auto;padding:20px;font-family:Arial;">
      <h1>Privacy Policy - YONOX</h1>
      <p>Last Updated: November 21, 2025</p>
      <h2>1. Information We Collect</h2>
      <p>We collect store URL, contact email, and product data you choose to import.</p>
      <h2>2. How We Use Your Information</h2>
      <p>We use data to provide our service and import products into your Shopify store.</p>
      <h2>3. Data Security</h2>
      <p>Your data is encrypted and stored securely on Vercel infrastructure.</p>
      <h2>4. Contact</h2>
      <p>Email: support@yonox.app</p>
    </body>
    </html>
  `);
});

// Webhooks GDPR
app.post('/webhooks/customers/data_request', express.raw({type: 'application/json'}), (req, res) => {
  console.log('Customer data request');
  res.status(200).send();
});

app.post('/webhooks/customers/redact', express.raw({type: 'application/json'}), (req, res) => {
  console.log('Customer redact');
  res.status(200).send();
});

app.post('/webhooks/shop/redact', express.raw({type: 'application/json'}), (req, res) => {
  console.log('Shop redact');
  res.status(200).send();
});

app.listen(PORT, () => console.log('🚀 YONOX sur port ' + PORT));