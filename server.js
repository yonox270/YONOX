require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const { scrapeProduct } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || '04440ad02feba547ef4446437d11b2d2';
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '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';
const SCOPES = 'write_products,read_products';
const HOST = 'https://yonox.vercel.app';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OAuth - Installation
app.get('/auth', (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).send('Missing shop');
  
  const nonce = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${HOST}/auth/callback`;
  
  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${redirectUri}&state=${nonce}`;
  
  res.redirect(authUrl);
});

// OAuth - Callback
app.get('/auth/callback', (req, res) => {
  const shop = req.query.shop;
  const host = req.query.host;
  
  // Redirection immédiate vers l'interface de l'app (OBLIGATOIRE pour Shopify)
  if (host) {
    res.redirect(`https://${shop}/admin/apps/${SHOPIFY_API_KEY}`);
  } else {
    res.redirect('/dashboard');
  }
});

// Homepage
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><title>YONOX</title>
    <style>body{font-family:Arial;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0}.container{background:#fff;padding:40px;border-radius:20px;max-width:500px;text-align:center}h1{color:#667eea;font-size:2.5em}.emoji{font-size:3em}ul{list-style:none;text-align:left;padding:20px}li:before{content:"✓ ";color:#667eea;font-weight:bold}a{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:15px 40px;text-decoration:none;border-radius:50px;display:inline-block}</style>
    </head><body><div class="container"><div class="emoji">🚀</div><h1>YONOX</h1><p>Import Intelligent de Produits</p><ul><li>Import depuis n'importe quel site</li><li>Extraction automatique des images</li><li>Détection intelligente</li></ul><a href="/dashboard">Commencer</a></div></body></html>
  `);
});

// Dashboard
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><title>YONOX Dashboard</title>
    <style>body{font-family:Arial;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;padding:20px}.container{max-width:800px;margin:0 auto;background:#fff;padding:40px;border-radius:20px}h1{color:#667eea}input{width:100%;padding:15px;border:2px solid #ddd;border-radius:10px;font-size:1em;box-sizing:border-box}button{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:15px 40px;border:none;border-radius:50px;cursor:pointer;font-size:1.1em;width:100%;margin-top:20px}#status{margin-top:20px;padding:15px;border-radius:10px;display:none}.success{background:#d4edda;color:#155724}.error{background:#f8d7da;color:#721c24}</style>
    </head><body><div class="container"><h1>📦 Importer un Produit</h1><form id="form"><input type="url" id="url" placeholder="https://example.com/product" required><button type="submit">🚀 Importer</button></form><div id="status"></div></div>
    <script>document.getElementById('form').addEventListener('submit',async(e)=>{e.preventDefault();const url=document.getElementById('url').value;const status=document.getElementById('status');status.style.display='block';status.className='';status.textContent='⏳ Import en cours...';try{const res=await fetch('/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});const data=await res.json();if(res.ok){status.className='success';status.textContent='✅ Importé: '+data.title}else{status.className='error';status.textContent='❌ '+data.error}}catch(err){status.className='error';status.textContent='❌ Erreur: '+err.message}});</script>
    </body></html>
  `);
});

// Import
app.post('/import', async (req, res) => {
  try {
    const product = await scrapeProduct(req.body.url || 'https://example.com');
    res.json({success: true, title: product.title, price: product.price});
  } catch (error) {
    res.json({error: error.message});
  }
});

// Privacy
app.get('/privacy', (req, res) => {
  res.send('<html><head><title>YONOX Privacy</title></head><body style="max-width:900px;margin:50px auto;padding:20px;font-family:Arial"><h1>Privacy Policy - YONOX</h1><p>Last Updated: November 21, 2025</p><h2>Information We Collect</h2><p>We collect store URL, email, and product data.</p><h2>Contact</h2><p>support@yonox.app</p></body></html>');
});

// Webhooks GDPR - VALIDATION HMAC
function verifyWebhook(req) {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const body = req.body;
  const hash = crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(body, 'utf8').digest('base64');
  return hash === hmac;
}

// Webhooks GDPR - HMAC validation
function verifyWebhook(req) {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const hash = crypto.createHmac('sha256', SHOPIFY_API_SECRET)
    .update(req.body, 'utf8')
    .digest('base64');
  return hash === hmac;
}

app.post('/webhooks/customers/data_request', express.raw({type: 'application/json'}), (req, res) => {
  if (!verifyWebhook(req)) return res.status(401).send('Unauthorized');
  console.log('✅ Customer data request');
  res.status(200).send();
});

app.post('/webhooks/customers/redact', express.raw({type: 'application/json'}), (req, res) => {
  if (!verifyWebhook(req)) return res.status(401).send('Unauthorized');
  console.log('✅ Customer redact');
  res.status(200).send();
});

app.post('/webhooks/shop/redact', express.raw({type: 'application/json'}), (req, res) => {
  if (!verifyWebhook(req)) return res.status(401).send('Unauthorized');
  console.log('✅ Shop redact');
  res.status(200).send();
});

app.listen(PORT, () => console.log('🚀 YONOX port ' + PORT));