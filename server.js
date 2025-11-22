require('dotenv').config();
const express = require('express');
const { scrapeProduct, downloadImage } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(`
    <html>
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

app.get('/dashboard', (req, res) => {
  res.send(`
    <html>
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

app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>YONOX - Privacy Policy</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 900px;
          margin: 50px auto;
          padding: 20px;
          line-height: 1.6;
          color: #333;
        }
        h1 { color: #667eea; margin-bottom: 30px; }
        h2 { color: #764ba2; margin-top: 30px; margin-bottom: 15px; }
        p { margin-bottom: 15px; }
        .last-updated { color: #666; font-style: italic; margin-bottom: 30px; }
      </style>
    </head>
    <body>
      <h1>Privacy Policy - YONOX</h1>
      <p class="last-updated">Last Updated: November 21, 2025</p>
      
      <h2>1. Introduction</h2>
      <p>YONOX ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our Shopify application.</p>
      
      <h2>2. Information We Collect</h2>
      <p>We collect the following types of information:</p>
      <ul>
        <li><strong>Store Information:</strong> Your Shopify store URL, store name, and contact email</li>
        <li><strong>Product Data:</strong> Product information you choose to import through our app</li>
        <li><strong>Usage Data:</strong> How you interact with our application</li>
      </ul>
      
      <h2>3. How We Use Your Information</h2>
      <p>We use the collected information to:</p>
      <ul>
        <li>Provide and maintain our service</li>
        <li>Import products into your Shopify store</li>
        <li>Improve and optimize our application</li>
        <li>Communicate with you about updates and support</li>
      </ul>
      
      <h2>4. Data Storage and Security</h2>
      <p>We implement industry-standard security measures to protect your data. Your information is stored securely on Vercel's infrastructure and is encrypted in transit.</p>
      
      <h2>5. Data Sharing</h2>
      <p>We do not sell, trade, or rent your personal information to third parties. We only share data with:</p>
      <ul>
        <li>Shopify (as required to provide our service)</li>
        <li>Service providers who assist in operating our application</li>
      </ul>
      
      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Request correction of your data</li>
        <li>Request deletion of your data</li>
        <li>Uninstall the app at any time</li>
      </ul>
      
      <h2>7. Data Retention</h2>
      <p>We retain your data only as long as necessary to provide our services. When you uninstall the app, your data is deleted within 30 days.</p>
      
      <h2>8. Cookies</h2>
      <p>We use essential cookies to maintain your session and ensure the app functions properly. We do not use tracking or advertising cookies.</p>
      
      <h2>9. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date.</p>
      
      <h2>10. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, please contact us at:</p>
      <p>Email: support@yonox.app</p>
      
      <p style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        © 2025 YONOX. All rights reserved.
      </p>
    </body>
    </html>
  `);
});


// WEBHOOKS GDPR OBLIGATOIRES
app.post('/webhooks/customers/data_request', express.raw({type: 'application/json'}), (req, res) => {
  console.log('Webhook: Customer data request received');
  // Log la demande - tu devras fournir les données du client sur demande
  res.status(200).send();
});

app.post('/webhooks/customers/redact', express.raw({type: 'application/json'}), (req, res) => {
  console.log('Webhook: Customer redact received');
  // Supprime les données du client de ta base de données
  res.status(200).send();
});

app.post('/webhooks/shop/redact', express.raw({type: 'application/json'}), (req, res) => {
  console.log('Webhook: Shop redact received');
  // Supprime toutes les données de la boutique après 48h de désinstallation
  res.status(200).send();
});

app.listen(PORT, () => console.log('🚀 YONOX sur port ' + PORT));