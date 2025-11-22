require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const { scrapeProduct } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.SHOPIFY_API_KEY || '04440ad02feba547ef4446437d11b2d2';
const API_SECRET = process.env.SHOPIFY_API_SECRET || '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';
const SCOPES = 'write_products,read_products';
const HOST = 'https://yonox.vercel.app';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. AUTHENTIFICATION IMMÉDIATE - Début OAuth
app.get('/auth', (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).send('Missing shop');
  
  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${HOST}/auth/callback`;
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${API_KEY}&scope=${SCOPES}&state=${state}&redirect_uri=${redirectUri}`;
  
  res.redirect(installUrl);
});

// 2. REDIRECTION IMMÉDIATE VERS UI - Callback OAuth avec échange de token
app.get('/auth/callback', async (req, res) => {
  const { shop, code } = req.query;
  
  if (!code) return res.status(400).send('Missing code');
  
  try {
    // Échange du code contre un access token (CRITIQUE pour Shopify)
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    const response = await axios.post(tokenUrl, {
      client_id: API_KEY,
      client_secret: API_SECRET,
      code: code
    });
    
    const accessToken = response.data.access_token;
    console.log('✅ OAuth successful for shop:', shop);
    
    // REDIRECTION IMMÉDIATE vers l'interface de l'app (OBLIGATOIRE)
    res.redirect(`/dashboard?shop=${shop}`);
    
  } catch (error) {
    console.error('OAuth error:', error.message);
    res.status(500).send('Authentication failed');
  }
});

// Homepage
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>YONOX</title><style>body{font-family:Arial;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0}.container{background:#fff;padding:40px;border-radius:20px;max-width:500px;text-align:center}h1{color:#667eea;font-size:2.5em}.emoji{font-size:3em}ul{list-style:none;padding:20px}li:before{content:"✓ ";color:#667eea;font-weight:bold}a{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:15px 40px;text-decoration:none;border-radius:50px;display:inline-block}</style></head><body><div class="container"><div class="emoji">🚀</div><h1>YONOX</h1><p>Import Intelligent de Produits</p><ul><li>Import depuis n'importe quel site</li><li>Extraction automatique</li><li>Interface simple</li></ul><a href="/dashboard">Commencer</a></div></body></html>`);
});

// Dashboard
app.get('/dashboard', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>YONOX Dashboard</title><style>body{font-family:Arial;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;padding:20px}.container{max-width:800px;margin:0 auto;background:#fff;padding:40px;border-radius:20px}h1{color:#667eea}input{width:100%;padding:15px;border:2px solid #ddd;border-radius:10px;font-size:1em;box-sizing:border-box}button{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:15px 40px;border:none;border-radius:50px;cursor:pointer;font-size:1.1em;width:100%;margin-top:20px}#status{margin-top:20px;padding:15px;border-radius:10px;display:none}.success{background:#d4edda;color:#155724}.error{background:#f8d7da;color:#721c24}</style></head><body><div class="container"><h1>📦 Importer un Produit</h1><form id="form"><input type="url" id="url" placeholder="https://example.com/product" required><button type="submit">🚀 Importer</button></form><div id="status"></div></div><script>document.getElementById('form').addEventListener('submit',async(e)=>{e.preventDefault();const url=document.getElementById('url').value;const status=document.getElementById('status');status.style.display='block';status.textContent='⏳ Import...';try{const res=await fetch('/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});const data=await res.json();if(res.ok){status.className='success';status.textContent='✅ Importé: '+data.title}else{status.className='error';status.textContent='❌ '+data.error}}catch(err){status.className='error';status.textContent='❌ '+err.message}});</script></body></html>`);
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
  res.send('<html><head><title>Privacy</title></head><body style="max-width:900px;margin:50px auto;padding:20px"><h1>Privacy Policy - YONOX</h1><p>Last Updated: November 21, 2025</p><h2>Information</h2><p>We collect store URL, email, product data.</p><h2>Contact</h2><p>support@yonox.app</p></body></html>');
});

// 3 & 4. WEBHOOKS GDPR avec VALIDATION HMAC (CRITIQUE)
app.post('/webhooks/customers/data_request', express.raw({type: 'application/json'}), (req, res) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  if (!hmac) return res.status(401).send('No HMAC');
  
  const hash = crypto.createHmac('sha256', API_SECRET).update(req.body, 'utf8').digest('base64');
  
  if (hash === hmac) {
    console.log('✅ customers/data_request verified');
    return res.status(200).send();
  }
  res.status(401).send('Invalid HMAC');
});

app.post('/webhooks/customers/redact', express.raw({type: 'application/json'}), (req, res) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  if (!hmac) return res.status(401).send('No HMAC');
  
  const hash = crypto.createHmac('sha256', API_SECRET).update(req.body, 'utf8').digest('base64');
  
  if (hash === hmac) {
    console.log('✅ customers/redact verified');
    return res.status(200).send();
  }
  res.status(401).send('Invalid HMAC');
});

app.post('/webhooks/shop/redact', express.raw({type: 'application/json'}), (req, res) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  if (!hmac) return res.status(401).send('No HMAC');
  
  const hash = crypto.createHmac('sha256', API_SECRET).update(req.body, 'utf8').digest('base64');
  
  if (hash === hmac) {
    console.log('✅ shop/redact verified');
    return res.status(200).send();
  }
  res.status(401).send('Invalid HMAC');
});

app.listen(PORT, () => console.log('🚀 YONOX port ' + PORT));