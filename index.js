// index.js
const express = require('express');
const { chromium } = require('playwright');
const app = express();

app.use(express.json());

app.post('/run', async (req, res) => {
  const { template, citation1, citation2, citation3 } = req.body;

  const templates = {
    intro: 'https://www.canva.com/design/your_intro_template_url',
    outro: 'https://www.canva.com/design/your_outro_template_url'
    // Ajoute ici d'autres templates si besoin
  };

  const templateUrl = templates[template];

  if (!templateUrl) {
    return res.status(400).send('Template inconnu');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Connexion à Canva
    await page.goto('https://www.canva.com/login');
    await page.fill('input[name="email"]', process.env.CANVA_EMAIL);
    await page.fill('input[name="password"]', process.env.CANVA_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Ouvrir le template sélectionné
    await page.goto(templateUrl);
    await page.waitForTimeout(5000);

    // Insérer les citations (ajuste les sélecteurs si nécessaire)
    await page.click('[data-testid="text-box"]');
    await page.keyboard.type(citation1);
    await page.keyboard.press('Tab');
    await page.keyboard.type(citation2);
    await page.keyboard.press('Tab');
    await page.keyboard.type(citation3);

    // Exporter la vidéo
    await page.click('button:has-text("Partager")');
    await page.click('button:has-text("Télécharger")');
    await page.click('button:has-text("Télécharger")');
    await page.waitForTimeout(10000);

    res.send('✅ Citation appliquée et vidéo exportée');
  } catch (err) {
    console.error('❌ Erreur :', err);
    res.status(500).send('Erreur lors de l'exécution du script.');
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur actif sur le port ${PORT}`));
