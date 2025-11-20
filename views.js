function homePage() {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>YONOX - Import de Produits Shopify</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
          width: 100%;
          text-align: center;
        }
        h1 { color: #667eea; font-size: 2.5em; margin-bottom: 10px; }
        .subtitle { color: #666; margin-bottom: 30px; font-size: 1.1em; }
        .features {
          text-align: left;
          margin: 30px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
        }
        .features li {
          margin: 10px 0;
          color: #444;
          list-style: none;
        }
        .features li:before {
          content: "✓ ";
          color: #667eea;
          font-weight: bold;
          margin-right: 10px;
        }
        .button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 40px;
          border: none;
          border-radius: 50px;
          text-decoration: none;
          display: inline-block;
          font-size: 1.1em;
          font-weight: 600;
        }
        .emoji { font-size: 3em; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="emoji">🚀</div>
        <h1>YONOX</h1>
        <p class="subtitle">Import Intelligent de Produits</p>
        <div class="features">
          <ul>
            <li>Import depuis n'importe quel site web</li>
            <li>Extraction automatique des images</li>
            <li>Détection des variantes et prix</li>
            <li>Interface simple et rapide</li>
          </ul>
        </div>
        <a href="/dashboard" class="button">Commencer</a>
      </div>
    </body>
    </html>
  `;
}

function dashboardPage() {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>YONOX - Dashboard</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { color: #667eea; margin-bottom: 30px; font-size: 2em; }
        .form-group { margin-bottom: 25px; }
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }
        input {
          width: 100%;
          padding: 15px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 1em;
        }
        input:focus { outline: none; border-color: #667eea; }
        .button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 40px;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          font-size: 1.1em;
          font-weight: 600;
          width: 100%;
        }
        #status {
          margin-top: 20px;
          padding: 15px;
          border-radius: 10px;
          display: none;
        }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .loading { background: #d1ecf1; color: #0c5460; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📦 Importer un Produit</h1>
        <form id="importForm">
          <div class="form-group">
            <label for="url">URL du produit à importer :</label>
            <input type="url" id="url" name="url" placeholder="https://example.com/product" required>
          </div>
          <button type="submit" class="button" id="submitBtn">🚀 Importer le produit</button>
        </form>
        <div id="status"></div>
      </div>
      <script>
        const form = document.getElementById('importForm');
        const statusDiv = document.getElementById('status');
        const submitBtn = document.getElementById('submitBtn');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const url = document.getElementById('url').value;
          statusDiv.className = 'loading';
          statusDiv.style.display = 'block';
          statusDiv.textContent = '⏳ Import en cours...';
          submitBtn.disabled = true;
          try {
            const response = await fetch('/import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url })
            });
            const data = await response.json();
            if (response.ok) {
              statusDiv.className = 'success';
              statusDiv.innerHTML = '✅ Produit importé ! Titre: ' + data.title;
            } else {
              throw new Error(data.error);
            }
          } catch (error) {
            statusDiv.className = 'error';
            statusDiv.textContent = '❌ ' + error.message;
          } finally {
            submitBtn.disabled = false;
          }
        });
      </script>
    </body>
    </html>
  `;
}

module.exports = { homePage, dashboardPage };