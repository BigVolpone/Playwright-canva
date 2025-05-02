// index.js
const express = require('express');
const { chromium } = require('playwright');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/run', async (req, res) => {
  const { template, citations, templateUrls } = req.body;

  const templateUrl = templateUrls?.[template];

  if (!templateUrl) {
    return res.status(400).send('⛔️ Template inconnu ou URL manquante');
  }

  if (!Array.isArray(citations) || citations.length === 0) {
    return res.status(400).send('⛔️ Aucune citation fournie');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Étape 1 : Connexion à Canva
    await page.goto('https://www.canva.com/login');
    await page.fill('input[name="email"]', process.env.CANVA_EMAIL);
    await page.fill('input[name="password"]', process.env.CANVA_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // Étape 2 : Ouvrir le bon template
    await page.goto(templateUrl);
    await page.waitForTimeout(5000); // Attente chargement

    // Étape 3 : Remplir les citations
    for (const citation of citations) {
      await page.click('[data-testid="text-box"]'); // à adapter si besoin
      await page.keyboard.type(citation);
      await page.keyboard.press('Tab');
    }

    // Étape 4 : Exporter la vidéo
    await page.click('button:has-text("Partager")');
    await page.click('button:has-text("Télécharger")');
    await page.click('button:has-text("Télécharger")');
    await page.waitForTimeout(10000);

    res.send('✅ Citations appliquées et vidéo exportée');
  } catch (err) {
    console.error('❌ Erreur :', err);
    res.status(500).send('Erreur dans le script');
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Serveur actif sur le port ${PORT}`));
