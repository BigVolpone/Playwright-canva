// index.js
const express = require('express');
const { chromium } = require('playwright');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());

app.post('/run', async (req, res) => {
  const { template, citations, templateUrls } = req.body;

  if (!template || !templateUrls || !templateUrls[template]) {
    return res.status(400).send({ error: 'Template inconnu ou URL manquante' });
  }

  if (!Array.isArray(citations) || citations.length === 0) {
    return res.status(400).send({ error: 'Aucune citation fournie' });
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

    // Accéder au template
    await page.goto(templateUrls[template]);
    await page.waitForTimeout(5000);

    // Injecter les citations (ex: 3 blocs texte à remplir)
    for (let i = 0; i < citations.length; i++) {
      await page.click('[data-testid="text-box"]');
      await page.keyboard.type(citations[i]);
      await page.keyboard.press('Tab');
    }

    // Exporter
    await page.click('button:has-text("Partager")');
    await page.click('button:has-text("Télécharger")');
    await page.click('button:has-text("Télécharger")');
    await page.waitForTimeout(10000);

    res.send('✅ Vidéo générée avec succès');
  } catch (err) {
    console.error('❌ Erreur :', err);
    res.status(500).send('Erreur lors de l\'exécution du script.');
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Serveur actif sur le port ${PORT}`);
});
